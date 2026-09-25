import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PaymentSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    milestoneId: { type: Schema.Types.ObjectId, default: null },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    date: { type: Date, required: true, index: true },
    method: { type: String, default: "" },
    period: { type: String, default: "" }, // yyyy-MM for monthly services
    reference: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof PaymentSchema> & { _id: mongoose.Types.ObjectId };

export const Payment: Model<PaymentDoc> =
  (mongoose.models.Payment as Model<PaymentDoc>) ||
  mongoose.model<PaymentDoc>("Payment", PaymentSchema);
