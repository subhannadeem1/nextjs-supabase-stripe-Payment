import type { Metadata } from "next";
import { Building2, Inbox, Send, Trophy } from "lucide-react";

import { ChartCard, HBars } from "@/components/charts/chart-kit";
import { WeeklyOutreachChart } from "@/components/charts/weekly-outreach-chart";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { getMarketingStats } from "@/data/stats";
import { CHANNEL_GROUP_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Insights" };

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function StatsPage() {
  const s = await getMarketingStats();
  const channelLabel = (g: string) => (g === "other" ? "Other / meeting" : CHANNEL_GROUP_LABEL[g as keyof typeof CHANNEL_GROUP_LABEL]);

  return (
    <>
      <PageHeader title="Insights" description="What’s working in your outreach — by week, channel, country and template." />
      <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Companies found" value={s.kpis.found} icon={Building2} hint={`${pct(s.kpis.contacted, s.kpis.found)} contacted`} />
          <StatCard label="Messages sent" value={s.kpis.messages} icon={Send} hint={`to ${s.kpis.contacted} companies`} />
          <StatCard
            label="Reply rate"
            value={s.kpis.replyRate === null ? "—" : `${s.kpis.replyRate}%`}
            icon={Inbox}
            hint={`${s.kpis.replied} companies replied`}
          />
          <StatCard label="Won" value={s.kpis.won} icon={Trophy} tone="brand" hint={`${pct(s.kpis.won, s.kpis.contacted)} of contacted`} />
        </div>

        <ChartCard
          title="Outreach per week"
          description="Messages, emails and calls you sent — last 12 weeks, by channel."
          table={{
            head: ["Week of", "LinkedIn", "Email", "WhatsApp", "Call", "Other"],
            rows: s.weeks.map((w) => [w.label, w.linkedin, w.email, w.whatsapp, w.call, w.other + w.meeting]),
          }}
        >
          <WeeklyOutreachChart data={s.weeks.map((w) => ({ ...w, other: w.other + w.meeting }))} />
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Pipeline funnel"
            description="How many companies reached each stage (ever)."
            table={{
              head: ["Stage", "Companies", "Of previous"],
              rows: s.funnel.map((f, i) => [f.stage, f.value, i === 0 ? "—" : pct(f.value, s.funnel[i - 1].value)]),
            }}
          >
            <HBars
              rows={s.funnel.map((f, i) => ({
                key: f.stage,
                label: f.stage,
                value: f.value,
                detail: i === 0 ? `${f.value} companies found` : `${f.value} companies · ${pct(f.value, s.funnel[i - 1].value)} of ${s.funnel[i - 1].stage.toLowerCase()}`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Reply rate by channel"
            description="Share of your messages that got an answer."
            table={{ head: ["Channel", "Sent", "Answered", "Rate"], rows: s.byChannel.map((c) => [channelLabel(c.group), c.sent, c.answered, `${c.rate}%`]) }}
          >
            <HBars
              empty="Log some outreach to see which channel works best."
              format={(v) => `${v}%`}
              rows={s.byChannel.map((c) => ({
                key: c.group,
                label: channelLabel(c.group),
                value: c.rate,
                detail: `${c.answered} answered of ${c.sent} sent`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Top countries"
            description="Where the companies you found are based."
            table={{ head: ["Country", "Found", "Contacted", "Replied"], rows: s.countries.map((c) => [c.name, c.found, c.contacted, c.replied]) }}
          >
            <HBars
              rows={s.countries.map((c) => ({
                key: c.code || "none",
                label: c.name,
                value: c.found,
                detail: `${c.found} found · ${c.contacted} contacted · ${c.replied} replied`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Template performance"
            description="Reply rate for messages sent from each template."
            table={{ head: ["Template", "Sent", "Answered", "Rate"], rows: s.templateStats.map((t) => [t.title, t.sent, t.answered, `${t.rate}%`]) }}
          >
            <HBars
              empty="Use “Use template → Log as sent” on a company page to track this."
              format={(v) => `${v}%`}
              rows={s.templateStats.map((t) => ({
                key: t.id,
                label: t.title,
                value: t.rate,
                detail: `${t.answered} answered of ${t.sent} sent`,
              }))}
            />
          </ChartCard>
        </div>
      </div>
    </>
  );
}
