"use client";

import { fmtDate, relativeDay, type DateLike } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Relative day label; server and browser may disagree on "today" so hydration is relaxed. */
export function RelTime({ date, className }: { date: DateLike; className?: string }) {
  if (!date) return <span className={cn("text-muted-foreground/60", className)}>—</span>;
  return (
    <time suppressHydrationWarning title={fmtDate(date, "EEE d MMM yyyy")} className={className}>
      {relativeDay(date)}
    </time>
  );
}
