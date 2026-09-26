import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CircleDollarSign, FileWarning, Repeat, TrendingUp, Wallet } from "lucide-react";

import { ChartCard } from "@/components/charts/chart-kit";
import { IncomeChart } from "@/components/charts/income-chart";
import { CompanyLogo } from "@/components/company-logo";
import { NewInvoiceButton, RecordPaymentButton } from "@/components/finance/record-payment-button";
import { PageHeader } from "@/components/page-header";
import { PaymentsList } from "@/components/projects/payments-list";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFinanceSummary } from "@/data/finance";
import { getSettings } from "@/data/settings";
import { fmtShort, periodLabel } from "@/lib/dates";
import { formatMoney, formatMoneyMap, orderedCurrencies } from "@/lib/money";

export const metadata: Metadata = { title: "Finance" };

export default async function FinancePage() {
  const [f, settings] = await Promise.all([getFinanceSummary(), getSettings()]);
  const cur = settings.defaultCurrency;
  const allCurrencies = Array.from(new Set([cur, ...f.currencies]));
  const hasMoney = f.months.some((m) => Object.keys(m.byCurrency).length) || f.activeProjects > 0;

  return (
    <>
      <PageHeader
        title="Finance"
        description="What came in, what’s still open, and what’s due next."
        actions={
          <>
            <NewInvoiceButton variant="outline" />
            <RecordPaymentButton />
          </>
        }
      />
      <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="This month"
            value={formatMoneyMap(f.receivedThisMonth, cur, { compact: true })}
            icon={Wallet}
            tone="brand"
            hint={`Last month ${formatMoneyMap(f.receivedLastMonth, cur, { compact: true })}`}
          />
          <StatCard label="This year" value={formatMoneyMap(f.receivedThisYear, cur, { compact: true })} icon={TrendingUp} />
          <StatCard
            label="Pending"
            value={formatMoneyMap(f.pending, cur, { compact: true })}
            icon={CircleDollarSign}
            tone={orderedCurrencies(f.pending, cur).length ? "warning" : "default"}
            hint="Across all projects"
          />
          <StatCard label="Monthly recurring" value={formatMoneyMap(f.mrr, cur, { compact: true })} icon={Repeat} hint={`${f.monthlyClients} active service${f.monthlyClients === 1 ? "" : "s"}`} href="/services" />
          <StatCard
            label="Unpaid invoices"
            value={formatMoneyMap(f.unpaidInvoices, cur, { compact: true })}
            icon={FileWarning}
            tone={f.overdueInvoices.count ? "danger" : "default"}
            hint={f.overdueInvoices.count ? `${f.overdueInvoices.count} overdue` : "None overdue"}
            href="/finance/invoices"
          />
        </div>

        {hasMoney ? (
          <ChartCard
            title="Money received per month"
            description="Payments recorded, by the month they arrived."
            table={{
              head: ["Month", ...allCurrencies],
              rows: f.months.map((m) => [periodLabel(m.period, "MMMM yyyy"), ...allCurrencies.map((c) => formatMoney(m.byCurrency[c] ?? 0, c))]),
            }}
          >
            <IncomeChart months={f.months} currencies={f.currencies} defaultCurrency={cur} />
          </ChartCard>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <CalendarCheck className="size-4 text-primary" /> Coming up
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {f.dueThisMonth.length === 0 && f.upcomingMilestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones or monthly payments due in the next 30 days.</p>
              ) : null}
              {f.dueThisMonth.map(({ project, period }) => (
                <Link key={project._id} href="/services" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-accent/40">
                  <CompanyLogo name={project.company?.name ?? "?"} domain={project.company?.domain} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{project.company?.name}</span>
                    <span className="text-xs text-muted-foreground">Monthly · {periodLabel(period, "MMMM")}</span>
                  </span>
                  <b className="tabular-nums">{formatMoney(project.monthlyAmount, project.currency)}</b>
                </Link>
              ))}
              {f.upcomingMilestones.map(({ project, milestone }) => (
                <Link key={milestone._id} href={`/projects/${project._id}`} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-accent/40">
                  <CompanyLogo name={project.company?.name ?? "?"} domain={project.company?.domain} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{milestone.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {project.title} · due {fmtShort(milestone.dueDate)}
                    </span>
                  </span>
                  <b className="tabular-nums">{formatMoney(milestone.amount - (milestone.paid ?? 0), project.currency)}</b>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <TrendingUp className="size-4 text-primary" /> Top clients (12 months)
              </CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/clients">
                  Clients <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-2">
              {f.topClients.length === 0 ? <p className="text-sm text-muted-foreground">No payments yet.</p> : null}
              {f.topClients.map((c, i) => (
                <Link key={c.companyId} href={`/marketing/companies/${c.companyId}`} className="flex items-center gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-accent/40">
                  <span className="grid size-6 place-items-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                  <b className="tabular-nums">{formatMoneyMap(c.total, cur)}</b>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Wallet className="size-4 text-primary" /> Recent payments
            </CardTitle>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/finance/payments">
                All payments <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <PaymentsList payments={f.recentPayments} showClient />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
