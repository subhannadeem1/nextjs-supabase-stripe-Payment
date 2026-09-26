"use server";

import { Types, type HydratedDocument } from "mongoose";
import { z } from "zod";

import { mutate, query, UserError } from "@/lib/action";
import {
  COMPANY_STATUS_LABEL,
  COMPANY_STATUS_VALUES,
  COMPANY_TYPES,
  CONFIGURATOR_EXISTS,
  PRIORITIES,
  RESEARCH_STEPS,
  SENIORITY,
  type CompanyStatus,
} from "@/lib/constants";
import { fromInputDate } from "@/lib/dates";
import {
  escapeRegex,
  letterOf,
  nameKey,
  normalizeDomain,
  normalizeEmail,
  normalizeLinkedIn,
} from "@/lib/normalize";
import { statusAfterResearch } from "@/lib/pipeline";
import { Activity } from "@/models/Activity";
import { Company, type CompanyDoc } from "@/models/Company";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid id");

const str = (max = 500) => z.string().trim().max(max).default("");

const CompanyInput = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  website: str(300),
  country: str(2).transform((v) => v.toUpperCase()),
  city: str(120),
  type: z.enum([...COMPANY_TYPES.map((t) => t.value), ""]).default(""),
  segments: z.array(z.string().max(60)).max(20).default([]),
  priority: z.enum([...PRIORITIES.map((p) => p.value), ""]).default(""),
  status: z.enum(COMPANY_STATUS_VALUES).default("researching"),
  opportunities: z.array(z.string().max(60)).max(20).default([]),
  source: str(200),
  tags: z.array(z.string().trim().max(40)).max(30).default([]),
  notes: str(20000),
  configurator: z
    .object({
      exists: z.enum(CONFIGURATOR_EXISTS.map((c) => c.value) as ["unknown", "yes", "no"]).default("unknown"),
      url: str(500),
      kind: str(60),
      weaknesses: str(5000),
    })
    .partial()
    .default({}),
});
export type CompanyInputT = z.input<typeof CompanyInput>;

type Lite = { _id: string; name: string; domain: string; status: CompanyStatus; country: string; lastContactedAt: string | null };

function lite(c: {
  _id: unknown;
  name: string;
  domain?: string | null;
  status: string;
  country?: string | null;
  lastContactedAt?: Date | null;
}): Lite {
  return {
    _id: String(c._id),
    name: c.name,
    domain: c.domain ?? "",
    status: c.status as CompanyStatus,
    country: c.country ?? "",
    lastContactedAt: c.lastContactedAt ? new Date(c.lastContactedAt).toISOString() : null,
  };
}

async function findDuplicates(name: string, website: string, excludeId?: string) {
  const domain = normalizeDomain(website);
  const key = nameKey(name);
  const exclude = excludeId && Types.ObjectId.isValid(excludeId) ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {};
  const select = "name domain status country lastContactedAt nameKey";

  const [domainHit, nameHits, similar] = await Promise.all([
    domain ? Company.findOne({ domain, ...exclude }).select(select).lean() : null,
    key ? Company.find({ nameKey: key, ...exclude }).select(select).limit(5).lean() : [],
    key.length >= 3
      ? Company.find({
          ...exclude,
          nameKey: { $ne: key, $regex: escapeRegex(key.slice(0, Math.min(key.length, 6))) },
        })
          .select(select)
          .limit(5)
          .lean()
      : [],
  ]);

  return {
    domain,
    domainMatch: domainHit ? lite(domainHit) : null,
    nameMatches: nameHits.filter((c) => String(c._id) !== String(domainHit?._id)).map(lite),
    similar: similar
      .filter((c) => String(c._id) !== String(domainHit?._id))
      .map(lite),
  };
}

export async function checkDuplicates(input: { name: string; website: string; excludeId?: string }) {
  return query(async () => findDuplicates(input.name ?? "", input.website ?? "", input.excludeId));
}

export async function createCompany(raw: CompanyInputT & { force?: boolean }) {
  return mutate(async () => {
    const input = CompanyInput.parse(raw);
    const dup = await findDuplicates(input.name, input.website);
    if (dup.domainMatch) {
      throw new UserError(`${dup.domainMatch.name} already uses ${dup.domain}. Open it instead of adding again.`);
    }
    if (dup.nameMatches.length && !raw.force) {
      throw new UserError(`A company called “${dup.nameMatches[0].name}” already exists.`);
    }
    const doc = await Company.create({
      ...input,
      nameKey: nameKey(input.name),
      letter: letterOf(input.name),
      domain: dup.domain,
      research: { website: false, configurator: input.configurator.exists !== "unknown", decisionMaker: false, contactInfo: false },
      statusChangedAt: new Date(),
    });
    return { id: String(doc._id) };
  });
}

export async function updateCompany(id: string, raw: Partial<CompanyInputT>) {
  return mutate(async () => {
    objectId.parse(id);
    const current = await Company.findById(id);
    if (!current) throw new UserError("Company not found");
    const input = CompanyInput.partial().parse(raw);

    if (input.name !== undefined) {
      current.name = input.name;
      current.nameKey = nameKey(input.name);
      current.letter = letterOf(input.name);
    }
    if (input.website !== undefined) {
      const domain = normalizeDomain(input.website);
      if (domain) {
        const clash = await Company.findOne({ domain, _id: { $ne: current._id } }).select("name").lean();
        if (clash) throw new UserError(`${clash.name} already uses ${domain}.`);
      }
      current.website = input.website;
      current.domain = domain;
    }
    const simple = ["country", "city", "type", "segments", "priority", "opportunities", "source", "tags", "notes"] as const;
    for (const key of simple) {
      if (input[key] !== undefined) current.set(key, input[key]);
    }
    if (input.configurator) {
      for (const [k, v] of Object.entries(input.configurator)) {
        if (v !== undefined) current.set(`configurator.${k}`, v);
      }
      if (input.configurator.exists && input.configurator.exists !== "unknown") {
        current.set("research.configurator", true);
      }
    }
    if (input.status && input.status !== current.status) {
      await applyStatus(current, input.status);
    }
    await current.save();
    return { id };
  });
}

type CompanyHydrated = HydratedDocument<CompanyDoc>;

async function applyStatus(company: CompanyHydrated, next: CompanyStatus, reason?: string) {
  const from = company.status as CompanyStatus;
  if (from === next) return;
  company.status = next;
  company.statusChangedAt = new Date();
  if (reason !== undefined) company.closedReason = reason;
  await Activity.create({
    companyId: company._id,
    kind: "status",
    direction: "none",
    date: new Date(),
    fromStatus: from,
    toStatus: next,
    summary: `${COMPANY_STATUS_LABEL[from]} → ${COMPANY_STATUS_LABEL[next]}${reason ? ` · ${reason}` : ""}`,
  });
}

export async function setCompanyStatus(id: string, status: CompanyStatus, reason?: string) {
  return mutate(async () => {
    objectId.parse(id);
    z.enum(COMPANY_STATUS_VALUES).parse(status);
    const company = await Company.findById(id);
    if (!company) throw new UserError("Company not found");
    await applyStatus(company, status, reason?.trim().slice(0, 500));
    await company.save();
    return { status };
  });
}

export async function setResearchStep(id: string, key: string, value: boolean) {
  return mutate(async () => {
    objectId.parse(id);
    if (!RESEARCH_STEPS.some((s) => s.key === key)) throw new UserError("Unknown step");
    const company = await Company.findById(id);
    if (!company) throw new UserError("Company not found");
    company.set(`research.${key}`, value);
    const research = company.toObject().research as Record<string, boolean>;
    const next = statusAfterResearch(company.status as CompanyStatus, research);
    if (next) await applyStatus(company, next);
    await company.save();
    return { movedTo: next };
  });
}

export async function updateCompanyNotes(id: string, notes: string) {
  return mutate(async () => {
    objectId.parse(id);
    await Company.updateOne({ _id: id }, { $set: { notes: z.string().max(20000).parse(notes) } });
    return null;
  });
}

export async function deleteCompany(id: string) {
  return mutate(async () => {
    objectId.parse(id);
    const [projects, invoices, payments] = await Promise.all([
      Project.countDocuments({ companyId: id }),
      Invoice.countDocuments({ companyId: id }),
      Payment.countDocuments({ companyId: id }),
    ]);
    if (projects || invoices || payments) {
      throw new UserError("This company has projects, invoices or payments. Delete those first.");
    }
    await Promise.all([
      Activity.deleteMany({ companyId: id }),
      Task.deleteMany({ companyId: id }),
      Company.deleteOne({ _id: id }),
    ]);
    return null;
  });
}

/* ------------------------------- Follow-ups ------------------------------- */

export async function setFollowUp(id: string, date: string | null, note?: string) {
  return mutate(async () => {
    objectId.parse(id);
    const d = date ? fromInputDate(date) : null;
    const $set: Record<string, unknown> = { followUpAt: d };
    if (note !== undefined) $set.followUpNote = note.trim().slice(0, 300);
    if (!d) $set.followUpNote = "";
    await Company.updateOne({ _id: id }, { $set });
    return null;
  });
}

export async function snoozeFollowUp(id: string, days: number) {
  return mutate(async () => {
    objectId.parse(id);
    const n = z.number().int().min(1).max(365).parse(days);
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(12, 0, 0, 0);
    await Company.updateOne({ _id: id }, { $set: { followUpAt: d } });
    return null;
  });
}

/* -------------------------------- Contacts -------------------------------- */

const ContactInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  role: str(120),
  seniority: z.enum([...SENIORITY.map((s) => s.value), ""]).default(""),
  decisionMaker: z.boolean().default(false),
  linkedin: str(300),
  email: z
    .string()
    .trim()
    .max(200)
    .default("")
    .refine((v) => !v || z.email().safeParse(v).success, "Email looks wrong"),
  phone: str(60),
  notes: str(3000),
});
export type ContactInputT = z.input<typeof ContactInput>;

/** Is this person already saved somewhere (same email / LinkedIn)? */
export async function checkContactDuplicate(input: { email?: string; linkedin?: string; excludeCompanyId?: string }) {
  return query(async () => {
    const email = normalizeEmail(input.email);
    const li = normalizeLinkedIn(input.linkedin);
    if (!email && !li) return null;
    const or: Record<string, unknown>[] = [];
    if (email) or.push({ "contacts.email": new RegExp(`^${escapeRegex(email)}$`, "i") });
    if (li) or.push({ "contacts.linkedinKey": li });
    const hit = await Company.findOne({ $or: or }).select("name contacts").lean();
    if (!hit) return null;
    const person = hit.contacts.find(
      (c) => (email && normalizeEmail(c.email) === email) || (li && c.linkedinKey === li),
    );
    return {
      companyId: String(hit._id),
      companyName: hit.name,
      personName: person?.name ?? "",
      sameCompany: String(hit._id) === input.excludeCompanyId,
    };
  });
}

export async function addContact(companyId: string, raw: ContactInputT) {
  return mutate(async () => {
    objectId.parse(companyId);
    const input = ContactInput.parse(raw);
    const company = await Company.findById(companyId);
    if (!company) throw new UserError("Company not found");
    company.contacts.push({ ...input, linkedinKey: normalizeLinkedIn(input.linkedin) });
    if (input.decisionMaker) company.set("research.decisionMaker", true);
    if (input.email || input.linkedin || input.phone) company.set("research.contactInfo", true);
    const research = company.toObject().research as Record<string, boolean>;
    const next = statusAfterResearch(company.status as CompanyStatus, research);
    if (next) await applyStatus(company, next);
    await company.save();
    const added = company.contacts[company.contacts.length - 1];
    return { id: String(added._id) };
  });
}

export async function updateContact(companyId: string, contactId: string, raw: ContactInputT) {
  return mutate(async () => {
    objectId.parse(companyId);
    objectId.parse(contactId);
    const input = ContactInput.parse(raw);
    const res = await Company.updateOne(
      { _id: companyId, "contacts._id": contactId },
      {
        $set: Object.fromEntries(
          Object.entries({ ...input, linkedinKey: normalizeLinkedIn(input.linkedin), updatedAt: new Date() }).map(
            ([k, v]) => [`contacts.$.${k}`, v],
          ),
        ),
      },
    );
    if (!res.matchedCount) throw new UserError("Person not found");
    // Keep the timeline readable if the name changed.
    await Activity.updateMany({ companyId, contactId }, { $set: { contactName: input.name } });
    return null;
  });
}

export async function deleteContact(companyId: string, contactId: string) {
  return mutate(async () => {
    objectId.parse(companyId);
    objectId.parse(contactId);
    await Company.updateOne({ _id: companyId }, { $pull: { contacts: { _id: contactId } } });
    return null;
  });
}

/* ---------------------------- Options for pickers ---------------------------- */

export async function listCompanyOptions() {
  return query(async () => {
    const rows = await Company.find()
      .select("name domain country status contacts._id contacts.name")
      .sort({ nameKey: 1 })
      .lean();
    return rows.map((c) => ({
      value: String(c._id),
      label: c.name,
      domain: c.domain ?? "",
      country: c.country ?? "",
      status: c.status as CompanyStatus,
      contacts: (c.contacts ?? []).map((p) => ({ value: String(p._id), label: p.name })),
    }));
  });
}
