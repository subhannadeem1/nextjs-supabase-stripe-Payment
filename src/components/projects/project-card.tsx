import Link from "next/link";
import { CalendarDays, ListChecks, Repeat } from "lucide-react";

import { ProjectStatusBadge } from "@/components/badges";
import { CompanyLogo } from "@/components/company-logo";
import { Progress } from "@/components/ui/progress";
import { daysFromToday, fmtShort } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { ProjectDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectCard({ p }: { p: ProjectDTO }) {
  const f = p.finance!;
  const included = p.scope.filter((s) => s.included);
  const done = included.filter((s) => s.done).length;
  const moneyPct = f.expected > 0 ? (f.received / f.expected) * 100 : 0;
  const left = p.billing === "one_time" && p.dueDate ? daysFromToday(p.dueDate) : null;
  const closed = p.status === "completed" || p.status === "cancelled" || p.status === "delivered";

  return (
    <Link href={`/projects/${p._id}`} className="group flex flex-col gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <CompanyLogo name={p.company?.name ?? "?"} domain={p.company?.domain} className="size-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium group-hover:text-primary">{p.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {p.company?.name}
            {p.type ? ` · ${p.type}` : ""}
          </div>
        </div>
        <ProjectStatusBadge status={p.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {p.billing === "monthly" ? (
            <>
              <Repeat className="size-3.5" /> {formatMoney(p.monthlyAmount, p.currency)}/mo
            </>
          ) : (
            <>
              <CalendarDays className="size-3.5" />
              {p.dueDate ? (
                <span
                  suppressHydrationWarning
                  className={cn(!closed && left !== null && left < 0 && "font-medium text-destructive", !closed && left !== null && left >= 0 && left <= 7 && "font-medium text-warning")}
                >
                  {closed ? `Due ${fmtShort(p.dueDate)}` : left !== null && left < 0 ? `${-left}d late` : left === 0 ? "Due today" : `${left}d left`}
                </span>
              ) : (
                "No deadline"
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
          <ListChecks className="size-3.5" /> {included.length ? `${done}/${included.length} scope` : "No scope yet"}
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Received</span>
          <span className="font-medium tabular-nums">
            {formatMoney(f.received, p.currency)} <span className="text-muted-foreground">/ {formatMoney(f.expected, p.currency)}</span>
          </span>
        </div>
        <Progress value={moneyPct} indicatorClassName={moneyPct >= 100 ? "bg-success" : undefined} />
        {f.pending > 0 ? (
          <div className="text-right text-xs font-medium text-warning tabular-nums">{formatMoney(f.pending, p.currency)} pending</div>
        ) : null}
      </div>
    </Link>
  );
}
