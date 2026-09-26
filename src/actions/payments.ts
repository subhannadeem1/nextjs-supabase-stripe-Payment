"use server";

import { Types } from "mongoose";
import { z } from "zod";

import { mutate, UserError } from "@/lib/action";
import { CURRENCIES } from "@/lib/constants";
import { fromInputDate } from "@/lib/dates";
import { Company } from "@/models/Company";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { Project } from "@/models/Project";

const optionalId = z
  .string()
  .nullish()
  .transform((v) => (v && Types.ObjectId.isValid(v) ? v : null));

const PaymentInput = z.object({
  companyId: optionalId,
  projectId: optionalId,
  milestoneId: optionalId,
  invoiceId: optionalId,
  amount: z.coerce.number().positive("Amount must be more than 0").max(1e10),
  currency: z.enum(CURRENCIES).default("EUR"),
  date: z.string().min(1, "Date is required"),
  method: z.string().trim().max(60).default(""),
  period: z
    .string()
    .trim()
    .default("")
    .refine((v) => !v || /^\d{4}-\d{2}$/.test(v), "Period must look like 2026-09"),
  reference: z.string().trim().max(200).default(""),
  note: z.string().trim().max(2000).default(""),
});
export type PaymentInputT = z.input<typeof PaymentInput>;

async function resolveCompany(input: z.output<typeof PaymentInput>) {
  if (input.projectId) {
    const project = await Project.findById(input.projectId).select("companyId").lean();
    if (!project) throw new UserError("Project not found");
    return String(project.companyId);
  }
  if (!input.companyId) throw new UserError("Pick a client or project");
  const exists = await Company.exists({ _id: input.companyId });
  if (!exists) throw new UserError("Client not found");
  return input.companyId;
}

export async function recordPayment(raw: PaymentInputT) {
  return mutate(async () => {
    const input = PaymentInput.parse(raw);
    const companyId = await resolveCompany(input);
    const doc = await Payment.create({
      ...input,
      companyId,
      date: fromInputDate(input.date) ?? new Date(),
    });
    return { id: String(doc._id) };
  });
}

export async function updatePayment(id: string, raw: PaymentInputT) {
  return mutate(async () => {
    if (!Types.ObjectId.isValid(id)) throw new UserError("Invalid id");
    const input = PaymentInput.parse(raw);
    const companyId = await resolveCompany(input);
    await Payment.updateOne(
      { _id: id },
      { $set: { ...input, companyId, date: fromInputDate(input.date) ?? new Date() } },
    );
    return null;
  });
}

export async function deletePayment(id: string) {
  return mutate(async () => {
    if (!Types.ObjectId.isValid(id)) throw new UserError("Invalid id");
    const pay = await Payment.findByIdAndDelete(id).lean();
    // An invoice paid by this payment goes back to "sent".
    if (pay?.invoiceId) {
      await Invoice.updateOne({ _id: pay.invoiceId, status: "paid" }, { $set: { status: "sent", paidAt: null } });
    }
    return null;
  });
}
