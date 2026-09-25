"use server";

import { addDays } from "date-fns";
import { Types } from "mongoose";
import { z } from "zod";

import { mutate, UserError } from "@/lib/action";
import { CURRENCIES, INVOICE_STATUS_VALUES, type InvoiceStatus } from "@/lib/constants";
import { fromInputDate } from "@/lib/dates";
import { invoiceTotals } from "@/lib/finance";
import { round2 } from "@/lib/money";
import { Company } from "@/models/Company";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { Project } from "@/models/Project";
import { Settings } from "@/models/Settings";

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid id");
const optionalId = z
  .string()
  .nullish()
  .transform((v) => (v && Types.ObjectId.isValid(v) ? v : null));

async function nextNumber() {
  const s = await Settings.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: { key: "main" }, $inc: { nextInvoiceNumber: 1 } },
    { upsert: true, returnDocument: "before", lean: true },
  );
  const n = s?.nextInvoiceNumber ?? 1;
  const prefix = s?.invoicePrefix ?? "INV-";
  const year = new Date().getFullYear();
  return `${prefix}${year}-${String(n).padStart(3, "0")}`;
}

export async function createInvoice(raw: { companyId: string; projectId?: string | null; currency?: string }) {
  return mutate(async () => {
    const companyId = objectId.parse(raw.companyId);
    const projectId = optionalId.parse(raw.projectId);
    const company = await Company.exists({ _id: companyId });
    if (!company) throw new UserError("Client not found");
    let currency = z.enum(CURRENCIES).catch("EUR").parse(raw.currency);
    const items: { description: string; quantity: number; unitPrice: number }[] = [];
    if (projectId) {
      const project = await Project.findById(projectId).lean();
      if (project) {
        currency = z.enum(CURRENCIES).catch(currency).parse(project.currency);
        if (project.billing === "monthly" && project.monthlyAmount) {
          items.push({ description: `${project.title} — monthly service`, quantity: 1, unitPrice: project.monthlyAmount });
        }
      }
    }
    if (!items.length) items.push({ description: "", quantity: 1, unitPrice: 0 });

    // Retry if a number was taken manually in the meantime.
    for (let attempt = 0; attempt < 5; attempt++) {
      const number = await nextNumber();
      try {
        const doc = await Invoice.create({
          number,
          companyId,
          projectId,
          currency,
          issueDate: new Date(),
          dueDate: addDays(new Date(), 14),
          items,
          notes: "",
        });
        return { id: String(doc._id) };
      } catch (err) {
        if ((err as { code?: number }).code !== 11000) throw err;
      }
    }
    throw new UserError("Couldn’t pick an invoice number — check Settings");
  });
}

const InvoiceInput = z.object({
  number: z.string().trim().min(1, "Invoice number is required").max(60),
  companyId: objectId,
  projectId: optionalId,
  currency: z.enum(CURRENCIES),
  issueDate: z.string().min(1),
  dueDate: z.string().nullish(),
  items: z
    .array(
      z.object({
        description: z.string().trim().max(500).default(""),
        quantity: z.coerce.number().min(0).max(1e6).default(1),
        unitPrice: z.coerce.number().min(-1e10).max(1e10).default(0),
        milestoneId: optionalId,
      }),
    )
    .max(100),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).max(1e10).default(0),
  notes: z.string().trim().max(5000).default(""),
});
export type InvoiceInputT = z.input<typeof InvoiceInput>;

export async function updateInvoice(id: string, raw: InvoiceInputT) {
  return mutate(async () => {
    objectId.parse(id);
    const input = InvoiceInput.parse(raw);
    const clash = await Invoice.findOne({ number: input.number, _id: { $ne: id } }).select("_id").lean();
    if (clash) throw new UserError(`Invoice number ${input.number} is already used`);
    await Invoice.updateOne(
      { _id: id },
      {
        $set: {
          ...input,
          issueDate: fromInputDate(input.issueDate) ?? new Date(),
          dueDate: input.dueDate ? fromInputDate(input.dueDate) : null,
          items: input.items.filter((i) => i.description || i.unitPrice),
        },
      },
    );
    return null;
  });
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus) {
  return mutate(async () => {
    objectId.parse(id);
    z.enum(INVOICE_STATUS_VALUES).parse(status);
    if (status === "paid") throw new UserError("Use “Mark as paid” so the payment is recorded");
    const $set: Record<string, unknown> = { status };
    if (status === "sent") $set.sentAt = new Date();
    $set.paidAt = null;
    await Invoice.updateOne({ _id: id }, { $set });
    return null;
  });
}

export async function markInvoicePaid(id: string, raw: { date: string; method?: string; reference?: string }) {
  return mutate(async () => {
    objectId.parse(id);
    const inv = await Invoice.findById(id);
    if (!inv) throw new UserError("Invoice not found");
    if (inv.status === "paid") throw new UserError("Already paid");
    const { total } = invoiceTotals(inv);
    if (total <= 0) throw new UserError("Invoice total is 0 — add items first");
    const date = fromInputDate(raw.date) ?? new Date();
    const base = {
      companyId: inv.companyId,
      projectId: inv.projectId,
      invoiceId: inv._id,
      currency: inv.currency,
      date,
      method: (raw.method ?? "").slice(0, 60),
      reference: (raw.reference || inv.number).slice(0, 200),
      note: `Invoice ${inv.number}`,
    };
    // Lines added from milestones pay those milestones; each gets its share of tax/discount.
    const { subtotal } = invoiceTotals(inv);
    const byMilestone = new Map<string, number>();
    for (const it of inv.items) {
      if (!it.milestoneId || subtotal <= 0) continue;
      const share = round2(((it.quantity * it.unitPrice) / subtotal) * total);
      byMilestone.set(String(it.milestoneId), (byMilestone.get(String(it.milestoneId)) ?? 0) + share);
    }
    const linked = [...byMilestone.values()].reduce((a, b) => a + b, 0);
    const docs: (typeof base & { milestoneId: string | null; amount: number })[] = [...byMilestone.entries()].map(
      ([milestoneId, amount]) => ({ ...base, milestoneId, amount }),
    );
    const rest = round2(total - linked);
    if (docs.length === 0) docs.push({ ...base, milestoneId: null, amount: total });
    else if (rest > 0.009) docs.push({ ...base, milestoneId: null, amount: rest });
    await Payment.insertMany(docs);
    inv.status = "paid";
    inv.paidAt = date;
    if (!inv.sentAt) inv.sentAt = date;
    await inv.save();
    return null;
  });
}

export async function deleteInvoice(id: string) {
  return mutate(async () => {
    objectId.parse(id);
    await Promise.all([
      Invoice.deleteOne({ _id: id }),
      Payment.updateMany({ invoiceId: id }, { $set: { invoiceId: null } }),
    ]);
    return null;
  });
}
