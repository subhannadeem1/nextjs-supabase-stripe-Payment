import "server-only";
import { Types } from "mongoose";

import { dbConnect } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import type { DemoDTO, TemplateDTO } from "@/lib/types";
import { Activity } from "@/models/Activity";
import { Demo } from "@/models/Demo";
import { Template } from "@/models/Template";

export async function listTemplates(): Promise<TemplateDTO[]> {
  await dbConnect();
  const [templates, usage] = await Promise.all([
    Template.find().sort({ updatedAt: -1 }).lean(),
    Activity.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { templateId: { $ne: null } } },
      { $group: { _id: "$templateId", n: { $sum: 1 } } },
    ]),
  ]);
  const used = new Map(usage.map((u) => [String(u._id), u.n]));
  return templates.map((t) => ({ ...serialize<TemplateDTO>(t), usedCount: used.get(String(t._id)) ?? 0 }));
}

export type DemoSend = { companyId: string; companyName: string; contactName: string; date: string; outcome: string };

export async function listDemos() {
  await dbConnect();
  const [demos, sends] = await Promise.all([
    Demo.find().sort({ createdAt: -1 }).lean(),
    Activity.find({ demoId: { $ne: null } })
      .select("demoId companyId contactName date outcome")
      .sort({ date: -1 })
      .populate("companyId", "name")
      .lean(),
  ]);
  const byDemo = new Map<string, DemoSend[]>();
  for (const s of sends) {
    const k = String(s.demoId);
    const company = s.companyId as unknown as { _id: Types.ObjectId; name: string } | null;
    if (!byDemo.has(k)) byDemo.set(k, []);
    byDemo.get(k)!.push({
      companyId: String(company?._id ?? s.companyId),
      companyName: company?.name ?? "Deleted company",
      contactName: s.contactName,
      date: new Date(s.date).toISOString(),
      outcome: s.outcome ?? "",
    });
  }
  return demos.map((d) => {
    const list = byDemo.get(String(d._id)) ?? [];
    return {
      ...serialize<DemoDTO>(d),
      sentCount: list.length,
      lastSentAt: list[0]?.date ?? null,
      sends: list,
    };
  });
}
