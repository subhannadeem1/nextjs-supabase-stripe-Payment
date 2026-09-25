import "server-only";
import { startOfMonth, startOfYear, subMonths } from "date-fns";

import { ACTIVE_PROJECT_STATUSES } from "@/lib/constants";
import { dbConnect } from "@/lib/db";
import { periodOf } from "@/lib/dates";
import { invoiceTotals } from "@/lib/finance";
import { addMoney, type MoneyMap } from "@/lib/money";
import { serialize } from "@/lib/serialize";
import type { InvoiceDTO, PaymentDTO, ProjectDTO } from "@/lib/types";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";

import { listProjects } from "./projects";

export type FinanceSummary = {
  receivedThisMonth: MoneyMap;
  receivedLastMonth: MoneyMap;
  receivedThisYear: MoneyMap;
  pending: MoneyMap;
  mrr: MoneyMap;
  unpaidInvoices: MoneyMap;
  overdueInvoices: { count: number; total: MoneyMap };
  months: { period: string; byCurrency: MoneyMap }[];
  topClients: { companyId: string; name: string; total: MoneyMap }[];
  activeProjects: number;
  monthlyClients: number;
  dueThisMonth: { project: ProjectDTO; period: string }[];
  upcomingMilestones: { project: ProjectDTO; milestone: ProjectDTO["milestones"][number] }[];
  recentPayments: PaymentDTO[];
  currencies: string[];
};

export async function getFinanceSummary(): Promise<FinanceSummary> {
  await dbConnect();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const yearStart = startOfYear(now);
  const since = startOfMonth(subMonths(now, 11));

  const [projects, payments, invoices, recent] = await Promise.all([
    listProjects(),
    Payment.find({ date: { $gte: since < yearStart ? since : yearStart } })
      .select("amount currency date companyId")
      .populate("companyId", "name")
      .lean(),
    Invoice.find({ status: "sent" }).lean(),
    Payment.find().sort({ date: -1 }).limit(8).populate("companyId", "name").populate("projectId", "title").lean(),
  ]);

  const receivedThisMonth: MoneyMap = {};
  const receivedLastMonth: MoneyMap = {};
  const receivedThisYear: MoneyMap = {};
  const monthMap = new Map<string, MoneyMap>();
  const clientMap = new Map<string, { name: string; total: MoneyMap }>();
  for (let i = 11; i >= 0; i--) monthMap.set(periodOf(subMonths(now, i)), {});

  for (const p of payments) {
    const d = new Date(p.date);
    if (d >= monthStart) addMoney(receivedThisMonth, p.currency, p.amount);
    if (d >= lastMonthStart && d < monthStart) addMoney(receivedLastMonth, p.currency, p.amount);
    if (d >= yearStart) addMoney(receivedThisYear, p.currency, p.amount);
    const per = periodOf(d);
    if (monthMap.has(per)) addMoney(monthMap.get(per)!, p.currency, p.amount);
    if (d >= since) {
      const company = p.companyId as unknown as { _id: unknown; name: string } | null;
      const key = String(company?._id ?? p.companyId);
      if (!clientMap.has(key)) clientMap.set(key, { name: company?.name ?? "Unknown", total: {} });
      addMoney(clientMap.get(key)!.total, p.currency, p.amount);
    }
  }

  const pending: MoneyMap = {};
  const mrr: MoneyMap = {};
  const dueThisMonth: FinanceSummary["dueThisMonth"] = [];
  const upcomingMilestones: FinanceSummary["upcomingMilestones"] = [];
  const currentPeriod = periodOf(now);
  const in30 = new Date(now.getTime() + 30 * 864e5);
  let activeProjects = 0;
  let monthlyClients = 0;

  for (const p of projects) {
    const active = ACTIVE_PROJECT_STATUSES.includes(p.status);
    if (active) activeProjects++;
    addMoney(pending, p.currency, p.finance?.pending ?? 0);
    if (p.billing === "monthly" && active && !(p.endDate && new Date(p.endDate) < now)) {
      addMoney(mrr, p.currency, p.monthlyAmount);
      monthlyClients++;
      if (p.finance?.unpaidPeriods.includes(currentPeriod)) dueThisMonth.push({ project: p, period: currentPeriod });
    }
    if (p.status !== "cancelled") {
      for (const m of p.milestones) {
        const unpaid = (m.paid ?? 0) < m.amount - 0.009;
        if (unpaid && m.dueDate && new Date(m.dueDate) <= in30) upcomingMilestones.push({ project: p, milestone: m });
      }
    }
  }
  upcomingMilestones.sort((a, b) => new Date(a.milestone.dueDate!).getTime() - new Date(b.milestone.dueDate!).getTime());

  const unpaidInvoices: MoneyMap = {};
  const overdue = { count: 0, total: {} as MoneyMap };
  for (const inv of invoices) {
    const { total } = invoiceTotals(inv);
    addMoney(unpaidInvoices, inv.currency, total);
    if (inv.dueDate && new Date(inv.dueDate) < now) {
      overdue.count++;
      addMoney(overdue.total, inv.currency, total);
    }
  }

  const currencies = Array.from(
    new Set([...payments.map((p) => p.currency), ...projects.map((p) => p.currency)]),
  );

  const topClients = [...clientMap.entries()]
    .map(([companyId, v]) => ({ companyId, ...v }))
    .sort((a, b) => Math.max(...Object.values(b.total)) - Math.max(...Object.values(a.total)))
    .slice(0, 6);

  const recentPayments = recent.map((p) => {
    const company = p.companyId as unknown as { _id: unknown; name: string } | null;
    const project = p.projectId as unknown as { _id: unknown; title: string } | null;
    const dto = serialize<PaymentDTO>({ ...p, companyId: company?._id ?? p.companyId, projectId: project?._id ?? null });
    dto.company = company ? serialize({ _id: company._id, name: company.name }) : null;
    dto.project = project ? serialize({ _id: project._id, title: project.title }) : null;
    return dto;
  });

  return {
    receivedThisMonth,
    receivedLastMonth,
    receivedThisYear,
    pending,
    mrr,
    unpaidInvoices,
    overdueInvoices: overdue,
    months: [...monthMap.entries()].map(([period, byCurrency]) => ({ period, byCurrency })),
    topClients,
    activeProjects,
    monthlyClients,
    dueThisMonth,
    upcomingMilestones,
    recentPayments,
    currencies,
  };
}

export type { InvoiceDTO };
