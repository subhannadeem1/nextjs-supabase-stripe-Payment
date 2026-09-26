import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const DemoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    product: { type: String, default: "" },
    url: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export type DemoDoc = InferSchemaType<typeof DemoSchema> & { _id: mongoose.Types.ObjectId };

export const Demo: Model<DemoDoc> =
  (mongoose.models.Demo as Model<DemoDoc>) || mongoose.model<DemoDoc>("Demo", DemoSchema);
