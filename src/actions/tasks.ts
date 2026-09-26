"use server";

import { Types } from "mongoose";
import { z } from "zod";

import { mutate, UserError } from "@/lib/action";
import { fromInputDate } from "@/lib/dates";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";

const optionalId = z
  .string()
  .nullish()
  .transform((v) => (v && Types.ObjectId.isValid(v) ? v : null));

const TaskInput = z.object({
  title: z.string().trim().min(1, "Write what needs doing").max(300),
  notes: z.string().trim().max(3000).default(""),
  dueDate: z
    .string()
    .nullish()
    .transform((v) => (v ? fromInputDate(v) : null)),
  priority: z.enum(["high", "normal", "low"]).default("normal"),
  companyId: optionalId,
  projectId: optionalId,
});
export type TaskInputT = z.input<typeof TaskInput>;

async function withProjectCompany(input: z.output<typeof TaskInput>) {
  if (input.projectId && !input.companyId) {
    const p = await Project.findById(input.projectId).select("companyId").lean();
    if (p) return { ...input, companyId: String(p.companyId) };
  }
  return input;
}

export async function createTask(raw: TaskInputT) {
  return mutate(async () => {
    const input = await withProjectCompany(TaskInput.parse(raw));
    const doc = await Task.create(input);
    return { id: String(doc._id) };
  });
}

export async function updateTask(id: string, raw: TaskInputT) {
  return mutate(async () => {
    if (!Types.ObjectId.isValid(id)) throw new UserError("Invalid id");
    const input = await withProjectCompany(TaskInput.parse(raw));
    await Task.updateOne({ _id: id }, { $set: input });
    return null;
  });
}

export async function toggleTask(id: string, done: boolean) {
  return mutate(async () => {
    if (!Types.ObjectId.isValid(id)) throw new UserError("Invalid id");
    await Task.updateOne({ _id: id }, { $set: { done, doneAt: done ? new Date() : null } });
    return null;
  });
}

export async function deleteTask(id: string) {
  return mutate(async () => {
    if (!Types.ObjectId.isValid(id)) throw new UserError("Invalid id");
    await Task.deleteOne({ _id: id });
    return null;
  });
}

export async function clearDoneTasks() {
  return mutate(async () => {
    const res = await Task.deleteMany({ done: true });
    return { deleted: res.deletedCount ?? 0 };
  });
}
