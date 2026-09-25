"use server";

import { z } from "zod";

import { mutate } from "@/lib/action";
import { CURRENCIES } from "@/lib/constants";
import { Settings } from "@/models/Settings";

const SettingsInput = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(120),
  ownerName: z.string().trim().max(120).default(""),
  email: z.string().trim().max(200).default(""),
  phone: z.string().trim().max(60).default(""),
  website: z.string().trim().max(200).default(""),
  address: z.string().trim().max(500).default(""),
  taxId: z.string().trim().max(80).default(""),
  defaultCurrency: z.enum(CURRENCIES),
  followUpDays: z.coerce.number().int().min(0).max(90),
  invoicePrefix: z.string().trim().max(20).default(""),
  nextInvoiceNumber: z.coerce.number().int().min(1).max(1_000_000),
  paymentDetails: z.string().trim().max(2000).default(""),
  invoiceNotes: z.string().trim().max(2000).default(""),
});
export type SettingsInputT = z.input<typeof SettingsInput>;

export async function saveSettings(raw: SettingsInputT) {
  return mutate(async () => {
    const input = SettingsInput.parse(raw);
    await Settings.updateOne({ key: "main" }, { $set: input }, { upsert: true });
    return null;
  });
}
