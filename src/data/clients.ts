import "server-only";

import { ACTIVE_PROJECT_STATUSES } from "@/lib/constants";
import { dbConnect } from "@/lib/db";
import { addMoney, type MoneyMap } from "@/lib/money";
import { serialize } from "@/lib/serialize";
import type { CompanyRow, ProjectDTO } from "@/lib/types";
import { Company } from "@/models/Company";
import { Payment } from "@/models/Payment";

import { listProjects } from "./projects";

export type ClientRow = {
  company: Pick<CompanyRow, "_id" | "name" | "domain" | "country" | "status"> & { primaryContact: string };
  projects: ProjectDTO[];
  activeProjects: number;
  contract: MoneyMap;
  received: MoneyMap;
  pending: MoneyMap;
  mrr: MoneyMap;
  lastPaymentAt: string | null;
};

export async function listClients(): Promise<ClientRow[]> {
  await dbConnect();
  const projects = await listProjects();
  const ids = new Set(projects.map((p) => p.companyId));
  const companies = await Company.find({ $or: [{ status: "won" }, { _id: { $in: [...ids] } }] })
    .select("name domain country status contacts.name contacts.decisionMaker")
    .sort({ nameKey: 1 })
    .lean();
  const lastPays = await Payment.aggregate<{ _id: unknown; last: Date }>([
    { $group: { _id: "$companyId", last: { $max: "$date" } } },
  ]);
  const lastBy = new Map(lastPays.map((p) => [String(p._id), p.last]));

  return companies.map((c) => {
    const mine = projects.filter((p) => p.companyId === String(c._id));
    const contract: MoneyMap = {};
    const received: MoneyMap = {};
    const pending: MoneyMap = {};
    const mrr: MoneyMap = {};
    for (const p of mine) {
      addMoney(contract, p.currency, p.finance?.expected ?? 0);
      addMoney(received, p.currency, p.finance?.received ?? 0);
      addMoney(pending, p.currency, p.finance?.pending ?? 0);
      if (p.billing === "monthly" && ACTIVE_PROJECT_STATUSES.includes(p.status)) addMoney(mrr, p.currency, p.monthlyAmount);
    }
    const primary = c.contacts?.find((x) => x.decisionMaker) ?? c.contacts?.[0];
    const last = lastBy.get(String(c._id));
    return {
      company: serialize({
        _id: c._id,
        name: c.name,
        domain: c.domain ?? "",
        country: c.country ?? "",
        status: c.status,
        primaryContact: primary?.name ?? "",
      }),
      projects: mine,
      activeProjects: mine.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status)).length,
      contract,
      received,
      pending,
      mrr,
      lastPaymentAt: last ? new Date(last).toISOString() : null,
    };
  });
}
