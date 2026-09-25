import "server-only";
import { Types } from "mongoose";

import { dbConnect } from "@/lib/db";
import { computeProjectFinance } from "@/lib/finance";
import { serialize } from "@/lib/serialize";
import type {
  ActivityDTO,
  CompanyDTO,
  CompanyRow,
  DemoDTO,
  ProjectDTO,
  TaskDTO,
  TemplateDTO,
} from "@/lib/types";
import { Activity } from "@/models/Activity";
import { Company } from "@/models/Company";
import { Demo } from "@/models/Demo";
import { Payment } from "@/models/Payment";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { Template } from "@/models/Template";

export async function listCompanyRows(): Promise<CompanyRow[]> {
  await dbConnect();
  const rows = await Company.find()
    .select(
      "name letter website domain country city type priority status configurator.exists configurator.kind opportunities tags contacts._id contacts.name contacts.role contacts.email contacts.decisionMaker lastContactedAt followUpAt followUpNote createdAt nameKey",
    )
    .sort({ nameKey: 1 })
    .lean();
  return serialize<CompanyRow[]>(rows);
}

export async function getCompanyDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await dbConnect();
  const company = await Company.findById(id).lean();
  if (!company) return null;

  const [activities, projects, payments, tasks, templates, demos] = await Promise.all([
    Activity.find({ companyId: id }).sort({ date: -1, createdAt: -1 }).lean(),
    Project.find({ companyId: id }).sort({ createdAt: -1 }).lean(),
    Payment.find({ companyId: id }).select("projectId amount period").lean(),
    Task.find({ companyId: id }).sort({ done: 1, dueDate: 1 }).lean(),
    Template.find().sort({ title: 1 }).lean(),
    Demo.find().sort({ title: 1 }).lean(),
  ]);

  const projectDTOs = projects.map((p) => {
    const pays = payments.filter((x) => String(x.projectId) === String(p._id));
    return { ...serialize<ProjectDTO>(p), finance: computeProjectFinance(p, pays) };
  });

  return {
    company: serialize<CompanyDTO>(company),
    activities: serialize<ActivityDTO[]>(activities),
    projects: projectDTOs,
    tasks: serialize<TaskDTO[]>(tasks),
    templates: serialize<TemplateDTO[]>(templates),
    demos: serialize<DemoDTO[]>(demos),
  };
}
