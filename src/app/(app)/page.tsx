import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Briefcase,
  CalendarClock,
  CheckSquare,
  CircleDollarSign,
  Clock4,
  Inbox,
  Send,
  Wallet,
} from "lucide-react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Greeting } from "@/components/dashboard/greeting";
import { PipelineBars } from "@/components/dashboard/pipeline-bars";
import { TaskChecklist } from "@/components/dashboard/task-checklist";
import { FollowUpList } from "@/components/companies/follow-up-list";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDueTasks, getFollowUps, getForgotten, getMarketingPulse } from "@/data/dashboard";
import { getFinanceSummary } from "@/data/finance";
import { getSettings } from "@/data/settings";
import { daysFromToday, fmtShort, periodLabel } from "@/lib/dates";
import { formatMoney, formatMoneyMap } from "@/lib/money";

export default async function TodayPage() {
  const [settings, followUps, forgotten, pulse, tasks, finance] = await Promise.all([
    getSettings(),
    getFollowUps(),
    getForgotten(),
    getMarketingPulse(),
    getDueTasks(),
    getFinanceSummary(),
  ]);
  const cur = settings.defaultCurrency;
  const due = followUps.filter((r) => (daysFromToday(r.followUpAt) ?? 1) <= 0);
  const soon = followUps.filter((r) => {
    const d = daysFromToday(r.followUpAt) ?? 0;
    return d > 0 && d <= 3;
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Greeting name={settings.ownerName} />
        <Button variant="outline" asChild>
          <Link href="/marketing/companies">
            Open client hunting <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Follow-ups due"
          value={due.length}
          hint={due.length ? "Overdue or today" : "All caught up"}
          icon={BellRing}
          tone={due.length ? "danger" : "success"}
          href="/marketing/follow-ups"
        />
        <StatCard label="Outreach this week" value={pulse.outWeek} hint={`${pulse.addedWeek} companies added`} icon={Send} href="/marketing/stats" />
        <StatCard
          label="Replies this week"
          value={pulse.repliesWeek}
          hint={pulse.replyRate30 !== null ? `${pulse.replyRate30}% reply rate (30 days)` : "No outreach in 30 days"}
          icon={Inbox}
          href="/marketing/stats"
        />
        <StatCard
          label="Received this month"
          value={formatMoneyMap(finance.receivedThisMonth, cur, { compact: true })}
          hint={`Last month ${formatMoneyMap(finance.receivedLastMonth, cur, { compact: true })}`}
          icon={Wallet}
          tone="brand"
          href="/finance"
        />
        <StatCard
          label="Pending payments"
          value={formatMoneyMap(finance.pending, cur, { compact: true })}
          hint={`${finance.activeProjects} active project${finance.activeProjects === 1 ? "" : "s"}`}
          icon={CircleDollarSign}
          tone={Object.keys(finance.pending).length ? "warning" : "default"}
          href="/finance"
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <BellRing className="size-4 text-primary" /> Chase today
              </CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/marketing/follow-ups">
                  All follow-ups <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FollowUpList
                rows={due}
                empty={
                  <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                    Nothing due today. {soon.length ? `${soon.length} coming up in the next 3 days.` : "Go find new companies 🚀"}
                  </p>
                }
              />
              {soon.length && due.length ? (
                <div className="grid gap-2">
                  <div className="text-xs font-medium text-muted-foreground">Next 3 days</div>
                  <FollowUpList rows={soon} />
                </div>
              ) : null}
              {forgotten.length ? (
                <div className="grid gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
                    <Clock4 className="size-3.5" /> Going cold — no reply, no follow-up planned
                  </div>
                  <FollowUpList rows={forgotten.slice(0, 4)} showLastContact />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Send className="size-4 text-primary" /> Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={pulse.recent} />
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <CheckSquare className="size-4 text-primary" /> Tasks due
              </CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/tasks">
                  All <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length ? (
                <TaskChecklist tasks={tasks} />
              ) : (
                <p className="text-sm text-muted-foreground">No tasks due in the next few days.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <CalendarClock className="size-4 text-primary" /> Money to collect
              </CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/finance">
                  Finance <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-2">
              {finance.dueThisMonth.length === 0 &&
              finance.upcomingMilestones.length === 0 &&
              finance.overdueInvoices.count === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing due right now.</p>
              ) : null}
              {finance.overdueInvoices.count ? (
                <Link
                  href="/finance/invoices"
                  className="flex items-center justify-between rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <span>
                    {finance.overdueInvoices.count} overdue invoice{finance.overdueInvoices.count > 1 ? "s" : ""}
                  </span>
                  <b>{formatMoneyMap(finance.overdueInvoices.total, cur)}</b>
                </Link>
              ) : null}
              {finance.dueThisMonth.map(({ project, period }) => (
                <Link
                  key={project._id}
                  href={`/services`}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{project.company?.name}</span>
                    <span className="text-xs text-muted-foreground">Monthly · {periodLabel(period, "MMMM")}</span>
                  </span>
                  <b className="tabular-nums">{formatMoney(project.monthlyAmount, project.currency)}</b>
                </Link>
              ))}
              {finance.upcomingMilestones.slice(0, 5).map(({ project, milestone }) => (
                <Link
                  key={milestone._id}
                  href={`/projects/${project._id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{milestone.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {project.company?.name} · due {fmtShort(milestone.dueDate)}
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
                <Briefcase className="size-4 text-primary" /> Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineBars counts={pulse.pipeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
