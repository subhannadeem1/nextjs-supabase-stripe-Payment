import type { Metadata } from "next";
import { CalendarCheck, CircleDollarSign, Repeat, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { ServicesView } from "@/components/projects/services-view";
import { StatCard } from "@/components/stat-card";
import { listProjects } from "@/data/projects";
import { getSettings } from "@/data/settings";
import { ACTIVE_PROJECT_STATUSES } from "@/lib/constants";
import { dbConnect } from "@/lib/db";
import { periodOf } from "@/lib/dates";
import { addMoney, formatMoneyMap, type MoneyMap } from "@/lib/money";
import { serialize } from "@/lib/serialize";
import type { PaymentDTO } from "@/lib/types";
import { Payment } from "@/models/Payment";

export const metadata: Metadata = { title: "Monthly services" };

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([listProjects({ billing: "monthly" }), getSettings()]);
  await dbConnect();
  const payments = serialize<Pick<PaymentDTO, "projectId" | "period" | "amount">[]>(
    await Payment.find({ projectId: { $in: services.map((s) => s._id) } }).select("projectId period amount").lean(),
  );
  const current = periodOf(new Date());
  const active = services.filter((s) => ACTIVE_PROJECT_STATUSES.includes(s.status) && !(s.endDate && new Date(s.endDate) < new Date()));
  const mrr: MoneyMap = {};
  const collected: MoneyMap = {};
  const due: MoneyMap = {};
  for (const s of active) {
    addMoney(mrr, s.currency, s.monthlyAmount);
    const paid = payments.filter((p) => p.projectId === s._id && p.period === current).reduce((a, p) => a + p.amount, 0);
    addMoney(collected, s.currency, paid);
    if (s.finance?.unpaidPeriods.includes(current)) addMoney(due, s.currency, Math.max(0, s.monthlyAmount - paid));
  }
  const cur = settings.defaultCurrency;
  const sorted = [...services].sort(
    (a, b) => Number(ACTIVE_PROJECT_STATUSES.includes(b.status)) - Number(ACTIVE_PROJECT_STATUSES.includes(a.status)),
  );

  return (
    <>
      <PageHeader
        title="Monthly services"
        description="Recurring clients — who paid this month and who hasn’t."
        actions={<NewProjectButton />}
      />
      <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Monthly recurring" value={formatMoneyMap(mrr, cur)} icon={Repeat} tone="brand" hint="MRR from active services" />
          <StatCard label="Active services" value={active.length} icon={Users} />
          <StatCard label="Collected this month" value={formatMoneyMap(collected, cur)} icon={CalendarCheck} tone="success" />
          <StatCard
            label="Still due this month"
            value={formatMoneyMap(due, cur)}
            icon={CircleDollarSign}
            tone={Object.keys(due).length ? "warning" : "default"}
          />
        </div>
        <ServicesView services={sorted} payments={payments} />
      </div>
    </>
  );
}
