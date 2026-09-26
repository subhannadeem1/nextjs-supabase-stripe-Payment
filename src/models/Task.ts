import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    dueDate: { type: Date, default: null, index: true },
    priority: { type: String, enum: ["high", "normal", "low"], default: "normal" },
    done: { type: Boolean, default: false, index: true },
    doneAt: { type: Date, default: null },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
  },
  { timestamps: true },
);

export type TaskDoc = InferSchemaType<typeof TaskSchema> & { _id: mongoose.Types.ObjectId };

export const Task: Model<TaskDoc> =
  (mongoose.models.Task as Model<TaskDoc>) || mongoose.model<TaskDoc>("Task", TaskSchema);
