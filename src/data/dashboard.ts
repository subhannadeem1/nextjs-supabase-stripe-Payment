import "server-only";
import { startOfDay, subDays } from "date-fns";

import { COMPANY_STATUS_VALUES, POSITIVE_OUTCOMES, type CompanyStatus } from "@/lib/constants";
import { dbConnect } from "@/lib/db";
import { endOfToday } from "@/lib/dates";
import { serialize } from "@/lib/serialize";
import type { ActivityDTO, CompanyRow, TaskDTO } from "@/lib/types";
import { Activity } from "@/models/Activity";
import { Company } from "@/models/Company";
import { Task } from "@/models/Task";

export async function getNavCounts() {
  try {
    await dbConnect();
    const end = endOfToday();
    const [followUps, tasks] = await Promise.all([
      Company.countDocuments({ followUpAt: { $ne: null, $lte: end } }),
      Task.countDocuments({ done: false, dueDate: { $ne: null, $lte: end } }),
    ]);
    return { followUps, tasks };
  } catch {
    return { followUps: 0, tasks: 0 };
  }
}

const ROW_FIELDS =
  "name letter website domain country city type priority status configurator.exists configurator.kind opportunities tags contacts._id contacts.name contacts.role contacts.email contacts.decisionMaker lastContactedAt followUpAt followUpNote createdAt";

export async function getFollowUps() {
  await dbConnect();
  const rows = await Company.find({ followUpAt: { $ne: null } })
    .select(ROW_FIELDS)
    .sort({ followUpAt: 1 })
    .lean();
  return serialize<CompanyRow[]>(rows);
}

/** "Contacted but silent" companies with no follow-up planned — easy to forget. */
export async function getForgotten(days = 10) {
  await dbConnect();
  const rows = await Company.find({
    status: { $in: ["contacted", "replied", "interested", "proposal"] },
    followUpAt: null,
    lastContactedAt: { $ne: null, $lte: subDays(new Date(), days) },
  })
    .select(ROW_FIELDS)
    .sort({ lastContactedAt: 1 })
    .limit(20)
    .lean();
  return serialize<CompanyRow[]>(rows);
}

export async function getMarketingPulse() {
  await dbConnect();
  const now = new Date();
  const weekAgo = startOfDay(subDays(now, 6));
  const monthAgo = startOfDay(subDays(now, 29));

  const [outWeek, repliesWeek, addedWeek, out30, positive30, statusCounts, recent] = await Promise.all([
    Activity.countDocuments({ direction: "out", date: { $gte: weekAgo } }),
    Activity.countDocuments({
      date: { $gte: weekAgo },
      $or: [{ kind: "reply" }, { direction: "out", outcome: { $in: POSITIVE_OUTCOMES } }],
    }),
    Company.countDocuments({ createdAt: { $gte: weekAgo } }),
    Activity.countDocuments({ direction: "out", date: { $gte: monthAgo } }),
    Activity.countDocuments({ direction: "out", date: { $gte: monthAgo }, outcome: { $in: POSITIVE_OUTCOMES } }),
    Company.aggregate<{ _id: CompanyStatus; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Activity.find({ kind: { $ne: "status" } })
      .sort({ date: -1, createdAt: -1 })
      .limit(8)
      .populate("companyId", "name domain")
      .lean(),
  ]);

  const pipeline = Object.fromEntries(COMPANY_STATUS_VALUES.map((s) => [s, 0])) as Record<CompanyStatus, number>;
  for (const s of statusCounts) pipeline[s._id] = s.n;

  const recentDTO = recent.map((a) => {
    const company = a.companyId as unknown as { _id: unknown; name: string; domain: string } | null;
    const dto = serialize<ActivityDTO>({ ...a, companyId: company?._id ?? a.companyId });
    dto.company = company ? serialize({ _id: company._id, name: company.name, domain: company.domain }) : null;
    return dto;
  });

  return {
    outWeek,
    repliesWeek,
    addedWeek,
    replyRate30: out30 ? Math.round((positive30 / out30) * 100) : null,
    out30,
    pipeline,
    recent: recentDTO,
  };
}

export async function getDueTasks() {
  await dbConnect();
  const end = endOfToday();
  const tasks = await Task.find({ done: false, dueDate: { $ne: null, $lte: new Date(end.getTime() + 2 * 864e5) } })
    .sort({ dueDate: 1, priority: 1 })
    .limit(12)
    .populate("companyId", "name")
    .populate("projectId", "title")
    .lean();
  return tasks.map((t) => {
    const company = t.companyId as unknown as { _id: unknown; name: string } | null;
    const project = t.projectId as unknown as { _id: unknown; title: string } | null;
    const dto = serialize<TaskDTO>({ ...t, companyId: company?._id ?? null, projectId: project?._id ?? null });
    dto.company = company ? serialize({ _id: company._id, name: company.name }) : null;
    dto.project = project ? serialize({ _id: project._id, title: project.title }) : null;
    return dto;
  });
}
