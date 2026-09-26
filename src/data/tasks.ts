import "server-only";
import { Types } from "mongoose";

import { dbConnect } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import type { TaskDTO } from "@/lib/types";
import { Task } from "@/models/Task";

export async function listTasks(): Promise<TaskDTO[]> {
  await dbConnect();
  const rows = await Task.find()
    .sort({ done: 1, dueDate: 1, createdAt: -1 })
    .populate("companyId", "name")
    .populate("projectId", "title")
    .lean();
  return rows.map((t) => {
    const company = t.companyId as unknown as { _id: Types.ObjectId; name: string } | null;
    const project = t.projectId as unknown as { _id: Types.ObjectId; title: string } | null;
    const dto = serialize<TaskDTO>({ ...t, companyId: company?._id ?? null, projectId: project?._id ?? null });
    dto.company = company ? serialize({ _id: company._id, name: company.name }) : null;
    dto.project = project ? serialize({ _id: project._id, title: project.title }) : null;
    return dto;
  });
}
