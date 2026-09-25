import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SettingsSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true },
    businessName: { type: String, default: "My Business" },
    ownerName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    address: { type: String, default: "" },
    taxId: { type: String, default: "" },
    defaultCurrency: { type: String, default: "EUR" },
    followUpDays: { type: Number, default: 5 },
    invoicePrefix: { type: String, default: "INV-" },
    nextInvoiceNumber: { type: Number, default: 1 },
    paymentDetails: { type: String, default: "" },
    invoiceNotes: { type: String, default: "Thank you for your business!" },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema> & { _id: mongoose.Types.ObjectId };

export const Settings: Model<SettingsDoc> =
  (mongoose.models.Settings as Model<SettingsDoc>) ||
  mongoose.model<SettingsDoc>("Settings", SettingsSchema);
