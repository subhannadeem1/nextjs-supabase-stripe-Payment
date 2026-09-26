import "server-only";
import { Types } from "mongoose";

import { dbConnect } from "@/lib/db";
import { computeProjectFinance } from "@/lib/finance";
import { serialize } from "@/lib/serialize";
import type { InvoiceDTO, PaymentDTO, ProjectDTO, TaskDTO } from "@/lib/types";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";

type Filter = Record<string, unknown>;

/** Projects with company info and money totals attached. */
export async function listProjects(filter: Filter = {}): Promise<ProjectDTO[]> {
  await dbConnect();
  const projects = await Project.find(filter)
    .populate("companyId", "name domain country")
    .sort({ createdAt: -1 })
    .lean();
  if (projects.length === 0) return [];
  const payments = await Payment.find({ projectId: { $in: projects.map((p) => p._id) } })
    .select("projectId amount period milestoneId")
    .lean();
  const byProject = new Map<string, typeof payments>();
  for (const pay of payments) {
    const k = String(pay.projectId);
    if (!byProject.has(k)) byProject.set(k, []);
    byProject.get(k)!.push(pay);
  }
  return projects.map((p) => {
    const company = p.companyId as unknown as { _id: Types.ObjectId; name: string; domain: string; country: string } | null;
    const pays = byProject.get(String(p._id)) ?? [];
    const dto = serialize<ProjectDTO>({ ...p, companyId: company?._id ?? p.companyId });
    dto.company = company ? serialize({ _id: company._id, name: company.name, domain: company.domain, country: company.country }) : null;
    dto.finance = computeProjectFinance(p, pays);
    dto.milestones = dto.milestones.map((m) => ({
      ...m,
      paid: pays.filter((x) => String(x.milestoneId) === m._id).reduce((s, x) => s + x.amount, 0),
    }));
    return dto;
  });
}

export async function getProjectDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await dbConnect();
  const [project] = await listProjects({ _id: new Types.ObjectId(id) });
  if (!project) return null;
  const [payments, tasks, invoices] = await Promise.all([
    Payment.find({ projectId: id }).sort({ date: -1 }).lean(),
    Task.find({ projectId: id }).sort({ done: 1, dueDate: 1, createdAt: 1 }).lean(),
    Invoice.find({ projectId: id }).sort({ issueDate: -1 }).lean(),
  ]);
  return {
    project,
    payments: serialize<PaymentDTO[]>(payments),
    tasks: serialize<TaskDTO[]>(tasks),
    invoices: serialize<InvoiceDTO[]>(invoices),
  };
}
