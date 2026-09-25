import "server-only";
import { format, startOfWeek, subWeeks } from "date-fns";

import {
  CHANNEL_GROUP,
  POSITIVE_OUTCOMES,
  STATUS_RANK,
  type Channel,
  type ChannelGroup,
  type CompanyStatus,
} from "@/lib/constants";
import { countryName, flagEmoji } from "@/lib/countries";
import { dbConnect } from "@/lib/db";
import { Activity } from "@/models/Activity";
import { Company } from "@/models/Company";
import { Template } from "@/models/Template";

export const STAT_GROUPS: ChannelGroup[] = ["linkedin", "email", "whatsapp", "call", "other"];

export type MarketingStats = Awaited<ReturnType<typeof getMarketingStats>>;

export async function getMarketingStats() {
  await dbConnect();
  const now = new Date();
  const firstWeek = startOfWeek(subWeeks(now, 11), { weekStartsOn: 1 });

  const [companies, outbound, statusMoves, templates] = await Promise.all([
    Company.find().select("status country lastContactedAt").lean(),
    Activity.find({ direction: "out" }).select("channel date outcome templateId companyId").lean(),
    Activity.find({ kind: "status" }).select("companyId toStatus").lean(),
    Template.find().select("title").lean(),
  ]);

  // Furthest stage each company ever reached (lost / not-a-fit keep their history).
  const maxRank = new Map<string, number>();
  const bump = (id: string, status: string) => {
    const r = STATUS_RANK[status as CompanyStatus];
    if (r === undefined || r >= 99) return;
    maxRank.set(id, Math.max(maxRank.get(id) ?? 0, r));
  };
  for (const c of companies) bump(String(c._id), c.status);
  for (const m of statusMoves) bump(String(m.companyId), m.toStatus ?? "");
  const contactedIds = new Set(outbound.map((a) => String(a.companyId)));
  for (const id of contactedIds) maxRank.set(id, Math.max(maxRank.get(id) ?? 0, STATUS_RANK.contacted));

  const reached = (rank: number) => companies.filter((c) => (maxRank.get(String(c._id)) ?? 0) >= rank).length;
  const funnel = [
    { stage: "Found", value: companies.length },
    { stage: "Contacted", value: reached(STATUS_RANK.contacted) },
    { stage: "Replied", value: reached(STATUS_RANK.replied) },
    { stage: "Interested", value: reached(STATUS_RANK.interested) },
    { stage: "Proposal", value: reached(STATUS_RANK.proposal) },
    { stage: "Won", value: reached(STATUS_RANK.won) },
  ];

  // Outreach per week, stacked by channel.
  const weeks: ({ week: string; label: string } & Record<ChannelGroup, number>)[] = [];
  for (let i = 0; i < 12; i++) {
    const start = startOfWeek(subWeeks(now, 11 - i), { weekStartsOn: 1 });
    weeks.push({
      week: format(start, "yyyy-MM-dd"),
      label: format(start, "d MMM"),
      linkedin: 0,
      email: 0,
      whatsapp: 0,
      call: 0,
      meeting: 0,
      other: 0,
    });
  }
  const groupOf = (ch: string): ChannelGroup => {
    const g = CHANNEL_GROUP[ch as Channel] ?? "other";
    return g === "meeting" ? "other" : g;
  };
  for (const a of outbound) {
    const d = new Date(a.date);
    if (d < firstWeek) continue;
    const key = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const w = weeks.find((x) => x.week === key);
    if (w) w[groupOf(a.channel ?? "")]++;
  }

  // Reply rate per channel.
  const byChannel = STAT_GROUPS.map((g) => {
    const list = outbound.filter((a) => groupOf(a.channel ?? "") === g);
    const answered = list.filter((a) => POSITIVE_OUTCOMES.includes(a.outcome as never)).length;
    return { group: g, sent: list.length, answered, rate: list.length ? Math.round((answered / list.length) * 100) : 0 };
  }).filter((r) => r.sent > 0);

  // Countries.
  const countryMap = new Map<string, { found: number; contacted: number; replied: number }>();
  for (const c of companies) {
    const code = c.country || "";
    if (!countryMap.has(code)) countryMap.set(code, { found: 0, contacted: 0, replied: 0 });
    const row = countryMap.get(code)!;
    row.found++;
    const r = maxRank.get(String(c._id)) ?? 0;
    if (r >= STATUS_RANK.contacted) row.contacted++;
    if (r >= STATUS_RANK.replied) row.replied++;
  }
  const countries = [...countryMap.entries()]
    .map(([code, v]) => ({ code, name: code ? `${flagEmoji(code)} ${countryName(code)}` : "Unknown", ...v }))
    .sort((a, b) => b.found - a.found)
    .slice(0, 10);

  // Template performance.
  const tplNames = new Map(templates.map((t) => [String(t._id), t.title]));
  const tplMap = new Map<string, { sent: number; answered: number }>();
  for (const a of outbound) {
    if (!a.templateId) continue;
    const k = String(a.templateId);
    if (!tplMap.has(k)) tplMap.set(k, { sent: 0, answered: 0 });
    const row = tplMap.get(k)!;
    row.sent++;
    if (POSITIVE_OUTCOMES.includes(a.outcome as never)) row.answered++;
  }
  const templateStats = [...tplMap.entries()]
    .map(([id, v]) => ({ id, title: tplNames.get(id) ?? "Deleted template", ...v, rate: Math.round((v.answered / v.sent) * 100) }))
    .sort((a, b) => b.sent - a.sent);

  const answeredAll = outbound.filter((a) => POSITIVE_OUTCOMES.includes(a.outcome as never)).length;
  return {
    kpis: {
      found: companies.length,
      contacted: funnel[1].value,
      replied: funnel[2].value,
      won: funnel[5].value,
      messages: outbound.length,
      replyRate: outbound.length ? Math.round((answeredAll / outbound.length) * 100) : null,
    },
    funnel,
    weeks,
    byChannel,
    countries,
    templateStats,
  };
}

