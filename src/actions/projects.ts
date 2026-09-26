"use server";

import { Types } from "mongoose";
import { z } from "zod";

import { mutate, query, UserError } from "@/lib/action";
import { COMPANY_STATUS_LABEL, CURRENCIES, PROJECT_STATUS_VALUES, type CompanyStatus, type ProjectStatus } from "@/lib/constants";
import { fromInputDate } from "@/lib/dates";
import { Activity } from "@/models/Activity";
import { Company } from "@/models/Company";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid id");
const money = z.coerce.number().min(0, "Must be 0 or more").max(1e10).default(0);
const dateStr = z
  .string()
  .nullish()
  .transform((v) => (v ? fromInputDate(v) : null));

const ProjectInput = z.object({
  companyId: objectId,
  title: z.string().trim().min(1, "Title is required").max(200),
  type: z.string().trim().max(80).default(""),
  billing: z.enum(["one_time", "monthly"]).default("one_time"),
  status: z.enum(PROJECT_STATUS_VALUES).default("planning"),
  currency: z.enum(CURRENCIES).default("EUR"),
  value: money,
  monthlyAmount: money,
  billingDay: z.coerce.number().int().min(1).max(28).default(1),
  startDate: dateStr,
  dueDate: dateStr,
  endDate: dateStr,
  description: z.string().trim().max(5000).default(""),
});
export type ProjectInputT = z.input<typeof ProjectInput>;

/** Starting a project means the deal is won — reflect that on the company. */
async function markCompanyWon(companyId: string | Types.ObjectId) {
  const company = await Company.findById(companyId).select("status");
  if (!company || company.status === "won") return;
  const from = company.status as CompanyStatus;
  company.status = "won";
  company.statusChangedAt = new Date();
  await company.save();
  await Activity.create({
    companyId,
    kind: "status",
    direction: "none",
    date: new Date(),
    fromStatus: from,
    toStatus: "won",
    summary: `${COMPANY_STATUS_LABEL[from]} → ${COMPANY_STATUS_LABEL.won} (project started)`,
  });
}

export async function createProject(raw: ProjectInputT & { scope?: string[] }) {
  return mutate(async () => {
    const input = ProjectInput.parse(raw);
    const exists = await Company.exists({ _id: input.companyId });
    if (!exists) throw new UserError("Company not found");
    const scope = (raw.scope ?? [])
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100)
      .map((title) => ({ title, included: true, done: false }));
    const doc = await Project.create({ ...input, startDate: input.startDate ?? new Date(), scope });
    await markCompanyWon(input.companyId);
    return { id: String(doc._id) };
  });
}

export async function updateProject(id: string, raw: Partial<ProjectInputT>) {
  return mutate(async () => {
    objectId.parse(id);
    const input = ProjectInput.partial().parse(raw);
    // Only keep keys that were actually sent.
    const $set = Object.fromEntries(Object.entries(input).filter(([k]) => k in raw));
    const res = await Project.updateOne({ _id: id }, { $set });
    if (!res.matchedCount) throw new UserError("Project not found");
    return null;
  });
}

export async function setProjectStatus(id: string, status: ProjectStatus) {
  return mutate(async () => {
    objectId.parse(id);
    z.enum(PROJECT_STATUS_VALUES).parse(status);
    const $set: Record<string, unknown> = { status };
    const project = await Project.findById(id).select("billing endDate");
    if (!project) throw new UserError("Project not found");
    if ((status === "cancelled" || status === "completed") && project.billing === "monthly" && !project.endDate) {
      $set.endDate = new Date();
    }
    await Project.updateOne({ _id: id }, { $set });
    return null;
  });
}

export async function deleteProject(id: string) {
  return mutate(async () => {
    objectId.parse(id);
    const [payments, invoices] = await Promise.all([
      Payment.countDocuments({ projectId: id }),
      Invoice.countDocuments({ projectId: id }),
    ]);
    if (payments || invoices) throw new UserError("This project has payments or invoices. Delete those first.");
    await Promise.all([Task.deleteMany({ projectId: id }), Project.deleteOne({ _id: id })]);
    return null;
  });
}

export async function updateProjectNotes(id: string, notes: string) {
  return mutate(async () => {
    objectId.parse(id);
    await Project.updateOne({ _id: id }, { $set: { notes: z.string().max(20000).parse(notes) } });
    return null;
  });
}

/* --------------------------------- Scope --------------------------------- */

export async function addScopeItems(projectId: string, titles: string[], included = true) {
  return mutate(async () => {
    objectId.parse(projectId);
    const items = titles
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 50)
      .map((title) => ({ title: title.slice(0, 300), included, done: false }));
    if (!items.length) throw new UserError("Write at least one item");
    await Project.updateOne({ _id: projectId }, { $push: { scope: { $each: items } } });
    return null;
  });
}

export async function updateScopeItem(
  projectId: string,
  itemId: string,
  patch: { title?: string; done?: boolean; included?: boolean },
) {
  return mutate(async () => {
    objectId.parse(projectId);
    objectId.parse(itemId);
    const $set: Record<string, unknown> = {};
    if (patch.title !== undefined) $set["scope.$.title"] = z.string().trim().min(1).max(300).parse(patch.title);
    if (patch.done !== undefined) $set["scope.$.done"] = Boolean(patch.done);
    if (patch.included !== undefined) $set["scope.$.included"] = Boolean(patch.included);
    await Project.updateOne({ _id: projectId, "scope._id": itemId }, { $set });
    return null;
  });
}

export async function deleteScopeItem(projectId: string, itemId: string) {
  return mutate(async () => {
    objectId.parse(projectId);
    objectId.parse(itemId);
    await Project.updateOne({ _id: projectId }, { $pull: { scope: { _id: itemId } } });
    return null;
  });
}

/* ------------------------------- Milestones ------------------------------- */

const MilestoneInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  dueDate: dateStr,
  amount: money,
});

export async function addMilestone(projectId: string, raw: z.input<typeof MilestoneInput>) {
  return mutate(async () => {
    objectId.parse(projectId);
    const input = MilestoneInput.parse(raw);
    await Project.updateOne({ _id: projectId }, { $push: { milestones: { ...input, done: false } } });
    return null;
  });
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  raw: Partial<z.input<typeof MilestoneInput>> & { done?: boolean },
) {
  return mutate(async () => {
    objectId.parse(projectId);
    objectId.parse(milestoneId);
    const input = MilestoneInput.partial().parse(raw);
    const $set: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) if (k in raw) $set[`milestones.$.${k}`] = v;
    if (raw.done !== undefined) {
      $set["milestones.$.done"] = raw.done;
      $set["milestones.$.doneAt"] = raw.done ? new Date() : null;
    }
    await Project.updateOne({ _id: projectId, "milestones._id": milestoneId }, { $set });
    return null;
  });
}

export async function deleteMilestone(projectId: string, milestoneId: string) {
  return mutate(async () => {
    objectId.parse(projectId);
    objectId.parse(milestoneId);
    await Promise.all([
      Project.updateOne({ _id: projectId }, { $pull: { milestones: { _id: milestoneId } } }),
      Payment.updateMany({ milestoneId }, { $set: { milestoneId: null } }),
    ]);
    return null;
  });
}

/* ---------------------------------- Links ---------------------------------- */

export async function addProjectLink(projectId: string, label: string, url: string) {
  return mutate(async () => {
    objectId.parse(projectId);
    const u = z.string().trim().min(1, "URL is required").max(1000).parse(url);
    await Project.updateOne(
      { _id: projectId },
      { $push: { links: { label: label.trim().slice(0, 100), url: u } } },
    );
    return null;
  });
}

export async function deleteProjectLink(projectId: string, linkId: string) {
  return mutate(async () => {
    objectId.parse(projectId);
    objectId.parse(linkId);
    await Project.updateOne({ _id: projectId }, { $pull: { links: { _id: linkId } } });
    return null;
  });
}

/* ------------------------------ Picker options ------------------------------ */

export async function listProjectOptions() {
  return query(async () => {
    const [projects, payments] = await Promise.all([
      Project.find().select("title companyId currency billing monthlyAmount milestones status").populate("companyId", "name").sort({ createdAt: -1 }).lean(),
      Payment.find({ milestoneId: { $ne: null } }).select("milestoneId amount").lean(),
    ]);
    const paidBy = new Map<string, number>();
    for (const p of payments) paidBy.set(String(p.milestoneId), (paidBy.get(String(p.milestoneId)) ?? 0) + p.amount);
    return projects.map((p) => {
      const company = p.companyId as unknown as { _id: Types.ObjectId; name: string } | null;
      return {
        value: String(p._id),
        label: p.title,
        companyId: String(company?._id ?? p.companyId),
        companyName: company?.name ?? "",
        currency: p.currency,
        billing: p.billing,
        status: p.status,
        monthlyAmount: p.monthlyAmount,
        milestones: p.milestones.map((m) => ({
          value: String(m._id),
          label: m.title,
          amount: m.amount,
          remaining: Math.max(0, m.amount - (paidBy.get(String(m._id)) ?? 0)),
        })),
      };
    });
  });
}
