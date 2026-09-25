import "server-only";
import { Types } from "mongoose";

import { dbConnect } from "@/lib/db";
import { invoiceTotals } from "@/lib/finance";
import { serialize } from "@/lib/serialize";
import type { CompanyDTO, InvoiceDTO, PaymentDTO } from "@/lib/types";
import { Company } from "@/models/Company";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { Project } from "@/models/Project";

export type InvoiceRow = InvoiceDTO & { total: number; overdue: boolean };

export async function listInvoices(): Promise<InvoiceRow[]> {
  await dbConnect();
  const rows = await Invoice.find()
    .sort({ issueDate: -1, number: -1 })
    .populate("companyId", "name country")
    .populate("projectId", "title")
    .lean();
  const now = new Date();
  return rows.map((inv) => {
    const company = inv.companyId as unknown as { _id: Types.ObjectId; name: string; country: string } | null;
    const project = inv.projectId as unknown as { _id: Types.ObjectId; title: string } | null;
    const dto = serialize<InvoiceDTO>({ ...inv, companyId: company?._id ?? inv.companyId, projectId: project?._id ?? null });
    dto.company = company ? serialize({ _id: company._id, name: company.name, country: company.country }) : null;
    dto.project = project ? serialize({ _id: project._id, title: project.title }) : null;
    return {
      ...dto,
      total: invoiceTotals(inv).total,
      overdue: inv.status === "sent" && Boolean(inv.dueDate && new Date(inv.dueDate) < now),
    };
  });
}

export async function getInvoice(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await dbConnect();
  const inv = await Invoice.findById(id).lean();
  if (!inv) return null;
  const [company, project, projects, payments] = await Promise.all([
    Company.findById(inv.companyId).lean(),
    inv.projectId ? Project.findById(inv.projectId).select("title milestones currency").lean() : null,
    Project.find({ companyId: inv.companyId }).select("title currency milestones").lean(),
    Payment.find({ invoiceId: inv._id }).sort({ date: -1 }).lean(),
  ]);
  return {
    invoice: serialize<InvoiceDTO>(inv),
    company: company ? serialize<CompanyDTO>(company) : null,
    project: project ? serialize<{ _id: string; title: string }>({ _id: project._id, title: project.title }) : null,
    projects: serialize<{ _id: string; title: string; currency: string; milestones: { _id: string; title: string; amount: number }[] }[]>(
      projects.map((p) => ({ _id: p._id, title: p.title, currency: p.currency, milestones: p.milestones.map((m) => ({ _id: m._id, title: m.title, amount: m.amount })) })),
    ),
    payments: serialize<PaymentDTO[]>(payments),
  };
}

export async function listPayments() {
  await dbConnect();
  const rows = await Payment.find().sort({ date: -1 }).populate("companyId", "name").populate("projectId", "title").lean();
  return rows.map((p) => {
    const company = p.companyId as unknown as { _id: Types.ObjectId; name: string } | null;
    const project = p.projectId as unknown as { _id: Types.ObjectId; title: string } | null;
    const dto = serialize<PaymentDTO>({ ...p, companyId: company?._id ?? p.companyId, projectId: project?._id ?? null });
    dto.company = company ? serialize({ _id: company._id, name: company.name }) : null;
    dto.project = project ? serialize({ _id: project._id, title: project.title }) : null;
    return dto;
  });
}
