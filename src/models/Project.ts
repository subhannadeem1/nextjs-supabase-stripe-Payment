import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { PROJECT_STATUS_VALUES } from "@/lib/constants";

const ScopeItemSchema = new Schema({
  title: { type: String, required: true, trim: true },
  included: { type: Boolean, default: true },
  done: { type: Boolean, default: false },
});

const MilestoneSchema = new Schema({
  title: { type: String, required: true, trim: true },
  dueDate: { type: Date, default: null },
  amount: { type: Number, default: 0 },
  done: { type: Boolean, default: false },
  doneAt: { type: Date, default: null },
});

const LinkSchema = new Schema({
  label: { type: String, default: "" },
  url: { type: String, required: true },
});

const ProjectSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, default: "" },
    billing: { type: String, enum: ["one_time", "monthly"], default: "one_time" },
    status: { type: String, enum: PROJECT_STATUS_VALUES, default: "planning", index: true },
    currency: { type: String, default: "EUR" },
    value: { type: Number, default: 0 }, // one-time contract value
    monthlyAmount: { type: Number, default: 0 },
    billingDay: { type: Number, default: 1 },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    endDate: { type: Date, default: null }, // monthly service end
    description: { type: String, default: "" },
    scope: { type: [ScopeItemSchema], default: [] },
    milestones: { type: [MilestoneSchema], default: [] },
    links: { type: [LinkSchema], default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: mongoose.Types.ObjectId };

export const Project: Model<ProjectDoc> =
  (mongoose.models.Project as Model<ProjectDoc>) ||
  mongoose.model<ProjectDoc>("Project", ProjectSchema);
