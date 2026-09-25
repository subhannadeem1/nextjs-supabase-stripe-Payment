import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { INVOICE_STATUS_VALUES } from "@/lib/constants";

const InvoiceItemSchema = new Schema({
  description: { type: String, default: "" },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  milestoneId: { type: Schema.Types.ObjectId, default: null },
});

const InvoiceSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    status: { type: String, enum: INVOICE_STATUS_VALUES, default: "draft", index: true },
    currency: { type: String, default: "EUR" },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    items: { type: [InvoiceItemSchema], default: [] },
    taxRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type InvoiceDoc = InferSchemaType<typeof InvoiceSchema> & { _id: mongoose.Types.ObjectId };

export const Invoice: Model<InvoiceDoc> =
  (mongoose.models.Invoice as Model<InvoiceDoc>) ||
  mongoose.model<InvoiceDoc>("Invoice", InvoiceSchema);
