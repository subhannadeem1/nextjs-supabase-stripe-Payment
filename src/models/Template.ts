import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { CHANNEL_VALUES } from "@/lib/constants";

const TemplateSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    channel: { type: String, enum: CHANNEL_VALUES, default: "linkedin_message" },
    kind: { type: String, enum: ["intro", "proposal", "demo", "follow_up"], default: "intro" },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
  },
  { timestamps: true },
);

export type TemplateDoc = InferSchemaType<typeof TemplateSchema> & { _id: mongoose.Types.ObjectId };

export const Template: Model<TemplateDoc> =
  (mongoose.models.Template as Model<TemplateDoc>) ||
  mongoose.model<TemplateDoc>("Template", TemplateSchema);
