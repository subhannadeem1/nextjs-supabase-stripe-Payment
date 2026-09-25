"use server";

import { Types } from "mongoose";
import { z } from "zod";

import { mutate, UserError } from "@/lib/action";
import {
  ACTIVITY_KINDS,
  CHANNEL_VALUES,
  COMPANY_STATUS_LABEL,
  OUTCOME_VALUES,
  type ActivityKind,
  type CompanyStatus,
  type Outcome,
} from "@/lib/constants";
import { fromInputDate } from "@/lib/dates";
import { directionOf, statusAfterActivity } from "@/lib/pipeline";
import { Activity } from "@/models/Activity";
import { Company } from "@/models/Company";

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid id");
const optionalId = z
  .string()
  .nullish()
  .transform((v) => (v && Types.ObjectId.isValid(v) ? v : null));

const LogInput = z.object({
  companyId: objectId,
  contactId: optionalId,
  channel: z.enum([...CHANNEL_VALUES, ""]).default(""),
  kind: z.enum(ACTIVITY_KINDS.map((k) => k.value) as [Exclude<ActivityKind, "status">, ...Exclude<ActivityKind, "status">[]]),
  date: z.string().min(1),
  summary: z.string().trim().max(5000).default(""),
  link: z.string().trim().max(1000).default(""),
  outcome: z.enum([...OUTCOME_VALUES, ""]).default(""),
  demoId: optionalId,
  templateId: optionalId,
  /** yyyy-MM-dd, "" = clear, undefined = leave as is */
  followUpDate: z.string().optional(),
  followUpNote: z.string().trim().max(300).optional(),
});
export type LogInputT = z.input<typeof LogInput>;

/** Last contacted = newest real touch (notes and status changes don't count). */
async function refreshLastContacted(companyId: string | Types.ObjectId) {
  const last = await Activity.findOne({ companyId, kind: { $nin: ["note", "status"] } })
    .sort({ date: -1 })
    .select("date")
    .lean();
  await Company.updateOne({ _id: companyId }, { $set: { lastContactedAt: last?.date ?? null } });
}

async function autoAdvance(companyId: string | Types.ObjectId, kind: ActivityKind, outcome: Outcome | "") {
  const company = await Company.findById(companyId).select("status");
  if (!company) return null;
  const from = company.status as CompanyStatus;
  const next = statusAfterActivity(from, kind, outcome);
  if (!next) return null;
  company.status = next;
  company.statusChangedAt = new Date();
  await company.save();
  await Activity.create({
    companyId,
    kind: "status",
    direction: "none",
    date: new Date(),
    fromStatus: from,
    toStatus: next,
    summary: `${COMPANY_STATUS_LABEL[from]} → ${COMPANY_STATUS_LABEL[next]} (automatic)`,
  });
  return { from, to: next };
}

export async function logActivity(raw: LogInputT) {
  return mutate(async () => {
    const input = LogInput.parse(raw);
    const company = await Company.findById(input.companyId).select("contacts status").lean();
    if (!company) throw new UserError("Company not found");

    const contact = input.contactId
      ? company.contacts.find((c) => String(c._id) === input.contactId)
      : null;
    if (input.contactId && !contact) throw new UserError("Person not found in this company");

    const date = fromInputDate(input.date) ?? new Date();
    await Activity.create({
      companyId: input.companyId,
      contactId: input.contactId,
      contactName: contact?.name ?? "",
      channel: input.kind === "note" ? "" : input.channel,
      kind: input.kind,
      direction: directionOf(input.kind),
      date,
      summary: input.summary,
      link: input.link,
      outcome: input.kind === "note" ? "" : input.outcome || (directionOf(input.kind) === "out" ? "pending" : ""),
      demoId: input.demoId,
      templateId: input.templateId,
    });

    if (input.followUpDate !== undefined) {
      const f = input.followUpDate ? fromInputDate(input.followUpDate) : null;
      await Company.updateOne(
        { _id: input.companyId },
        { $set: { followUpAt: f, followUpNote: f ? (input.followUpNote ?? "") : "" } },
      );
    }

    await refreshLastContacted(input.companyId);
    const moved = await autoAdvance(input.companyId, input.kind, input.outcome);
    return { moved };
  });
}

export async function setActivityOutcome(id: string, outcome: Outcome) {
  return mutate(async () => {
    objectId.parse(id);
    z.enum(OUTCOME_VALUES).parse(outcome);
    const act = await Activity.findByIdAndUpdate(id, { $set: { outcome } }, { returnDocument: "after" }).lean();
    if (!act) throw new UserError("Activity not found");
    const moved = await autoAdvance(act.companyId, act.kind as ActivityKind, outcome);
    return { moved };
  });
}

const EditInput = LogInput.pick({ channel: true, kind: true, date: true, summary: true, link: true, outcome: true, contactId: true });

export async function updateActivity(id: string, raw: z.input<typeof EditInput>) {
  return mutate(async () => {
    objectId.parse(id);
    const input = EditInput.parse(raw);
    const act = await Activity.findById(id);
    if (!act) throw new UserError("Activity not found");
    let contactName = act.contactName;
    if (input.contactId !== String(act.contactId ?? "")) {
      const company = await Company.findById(act.companyId).select("contacts").lean();
      contactName = company?.contacts.find((c) => String(c._id) === input.contactId)?.name ?? "";
    }
    act.set({
      ...input,
      contactId: input.contactId,
      contactName,
      direction: directionOf(input.kind),
      date: fromInputDate(input.date) ?? act.date,
    });
    await act.save();
    await refreshLastContacted(act.companyId);
    return null;
  });
}

export async function deleteActivity(id: string) {
  return mutate(async () => {
    objectId.parse(id);
    const act = await Activity.findByIdAndDelete(id).lean();
    if (act) await refreshLastContacted(act.companyId);
    return null;
  });
}
