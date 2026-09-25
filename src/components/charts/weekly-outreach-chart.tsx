"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHANNEL_GROUP_LABEL, type ChannelGroup } from "@/lib/constants";

import { ChartTooltip, Legend, SERIES } from "./chart-kit";

const GROUPS: ChannelGroup[] = ["linkedin", "email", "whatsapp", "call", "other"];

export function WeeklyOutreachChart({ data }: { data: ({ label: string } & Record<ChannelGroup, number>)[] }) {
  const used = GROUPS.filter((g) => data.some((d) => d[g] > 0));
  const series = (used.length ? used : ["linkedin" as ChannelGroup]).map((g) => ({
    key: g,
    label: g === "other" ? "Other / meeting" : CHANNEL_GROUP_LABEL[g],
    // Colour follows the channel, not its position among the ones in use.
    color: SERIES[GROUPS.indexOf(g)],
  }));
  return (
    <div className="grid gap-3">
      {series.length > 1 ? <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} /> : null}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ChartTooltip total />} />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="a"
                fill={s.color}
                stroke="var(--card)"
                strokeWidth={2}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={36}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
