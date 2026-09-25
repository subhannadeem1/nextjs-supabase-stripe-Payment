import { Check, CircleHelp, X } from "lucide-react";

import { daysFromToday, fmtShort } from "@/lib/dates";
import type { CompanyRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ConfiguratorCell({ c }: { c: Pick<CompanyRow, "configurator"> }) {
  const { exists, kind } = c.configurator ?? { exists: "unknown", kind: "" };
  if (exists === "yes")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-success/12 px-1.5 py-0.5 text-xs font-medium text-success">
        <Check className="size-3" /> {kind || "Yes"}
      </span>
    );
  if (exists === "no")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-300">
        <X className="size-3" /> None
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
      <CircleHelp className="size-3" /> ?
    </span>
  );
}

export function FollowUpCell({ date, compact }: { date: string | null; compact?: boolean }) {
  if (!date) return <span className="text-muted-foreground/60">—</span>;
  const diff = daysFromToday(date) ?? 0;
  const tone =
    diff < 0
      ? "bg-destructive/12 text-destructive"
      : diff === 0
        ? "bg-warning/14 text-warning"
        : "text-muted-foreground";
  const label = diff < 0 ? `${-diff}d overdue` : diff === 0 ? "Today" : fmtShort(date);
  return (
    <span
      suppressHydrationWarning
      className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium", tone, compact && "px-1")}
    >
      {label}
    </span>
  );
}

export function OpportunityChips({ items, max = 2 }: { items: string[]; max?: number }) {
  if (!items?.length) return <span className="text-muted-foreground/60">—</span>;
  const shown = items.slice(0, max);
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((o) => (
        <span key={o} className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">
          {o}
        </span>
      ))}
      {items.length > max ? <span className="text-[11px] text-muted-foreground">+{items.length - max}</span> : null}
    </span>
  );
}
