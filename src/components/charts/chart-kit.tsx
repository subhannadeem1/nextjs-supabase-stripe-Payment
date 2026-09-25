"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

export function ChartCard({
  title,
  description,
  children,
  table,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Accessible data view (also the relief for low-contrast series colours). */
  table?: { head: string[]; rows: (string | number)[][] };
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border bg-card p-5", className)}>
      <header className="mb-4">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {description ? <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p> : null}
      </header>
      <div className="flex-1">{children}</div>
      {table && table.rows.length ? (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground select-none hover:text-foreground">
            View data as table
          </summary>
          <div className="mt-2 overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  {table.head.map((h) => (
                    <th key={h} className="py-1.5 pr-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {r.map((c, j) => (
                      <td key={j} className={cn("py-1.5 pr-3", j > 0 && "tabular-nums")}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </section>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Horizontal bars as plain HTML: value labels are always visible, each bar has
 * a hover tooltip, and one hue carries the single measure.
 */
export function HBars({
  rows,
  format = (v) => String(v),
  color = "var(--series-solo)",
  empty = "No data yet.",
}: {
  rows: { label: React.ReactNode; value: number; detail?: string; key: string }[];
  format?: (v: number) => string;
  color?: string;
  empty?: string;
}) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="grid gap-2.5">
      {rows.map((r) => (
        <Tooltip key={r.key}>
          <TooltipTrigger asChild>
            <div className="group grid grid-cols-[minmax(90px,140px)_1fr_auto] items-center gap-3 rounded-md py-0.5 text-sm">
              <span className="truncate text-muted-foreground group-hover:text-foreground">{r.label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.max(r.value > 0 ? 2 : 0, (r.value / max) * 100)}%`, background: color }}
                />
              </span>
              <span className="min-w-10 text-right text-xs font-medium tabular-nums">{format(r.value)}</span>
            </div>
          </TooltipTrigger>
          {r.detail ? <TooltipContent side="top">{r.detail}</TooltipContent> : null}
        </Tooltip>
      ))}
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  format = (v: number) => String(v),
  total,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string;
  format?: (v: number) => string;
  total?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const sum = payload.reduce((s, p) => s + (Number(p.value) || 0), 0);
  return (
    <div className="min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="mb-1.5 font-medium">{label}</div>
      <div className="grid gap-1">
        {payload
          .filter((p) => Number(p.value) > 0 || payload.length === 1)
          .map((p) => (
            <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
              <span className="size-2 rounded-[2px]" style={{ background: p.color }} />
              <span className="text-muted-foreground">{p.name}</span>
              <span className="ml-auto font-medium tabular-nums">{format(Number(p.value) || 0)}</span>
            </div>
          ))}
        {total && payload.length > 1 ? (
          <div className="mt-1 flex items-center justify-between border-t pt-1 font-medium">
            <span>Total</span>
            <span className="tabular-nums">{format(sum)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
