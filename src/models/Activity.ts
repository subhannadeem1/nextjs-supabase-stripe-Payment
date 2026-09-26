import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { ACTIVITY_KIND_VALUES, CHANNEL_VALUES, OUTCOME_VALUES } from "@/lib/constants";

const ActivitySchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, default: null },
    contactName: { type: String, default: "" },
    channel: { type: String, enum: [...CHANNEL_VALUES, ""], default: "" },
    kind: { type: String, enum: ACTIVITY_KIND_VALUES, required: true },
    direction: { type: String, enum: ["out", "in", "none"], default: "out" },
    date: { type: Date, required: true, index: true },
    summary: { type: String, default: "" },
    link: { type: String, default: "" },
    outcome: { type: String, enum: [...OUTCOME_VALUES, ""], default: "" },
    demoId: { type: Schema.Types.ObjectId, ref: "Demo", default: null, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: "Template", default: null },
    fromStatus: { type: String, default: "" },
    toStatus: { type: String, default: "" },
  },
  { timestamps: true },
);

ActivitySchema.index({ companyId: 1, date: -1 });

export type ActivityDoc = InferSchemaType<typeof ActivitySchema> & { _id: mongoose.Types.ObjectId };

export const Activity: Model<ActivityDoc> =
  (mongoose.models.Activity as Model<ActivityDoc>) ||
  mongoose.model<ActivityDoc>("Activity", ActivitySchema);
