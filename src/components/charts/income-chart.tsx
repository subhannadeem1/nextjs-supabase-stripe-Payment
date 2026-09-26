"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { periodLabel } from "@/lib/dates";
import { formatMoney, type MoneyMap } from "@/lib/money";
import { cn } from "@/lib/utils";

import { ChartTooltip } from "./chart-kit";

/** Income per month for one currency at a time (never mixes currencies on one axis). */
export function IncomeChart({
  months,
  currencies,
  defaultCurrency,
}: {
  months: { period: string; byCurrency: MoneyMap }[];
  currencies: string[];
  defaultCurrency: string;
}) {
  const list = currencies.length ? [...currencies].sort((a, b) => (a === defaultCurrency ? -1 : b === defaultCurrency ? 1 : a.localeCompare(b))) : [defaultCurrency];
  const [currency, setCurrency] = useState(list[0]);
  const data = months.map((m) => ({ label: periodLabel(m.period, "MMM yy"), value: m.byCurrency[currency] ?? 0 }));
  const total = data.reduce((s, d) => s + d.value, 0);
  const fmt = (v: number) => formatMoney(v, currency);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Last 12 months: <b className="text-foreground tabular-nums">{fmt(total)}</b>
        </div>
        {list.length > 1 ? (
          <div className="flex rounded-lg border bg-muted/40 p-0.5">
            {list.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium", c === currency ? "bg-card shadow-sm" : "text-muted-foreground")}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barCategoryGap="24%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })}
            />
            <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ChartTooltip format={fmt} />} />
            <Bar dataKey="value" name="Received" fill="var(--series-solo)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
