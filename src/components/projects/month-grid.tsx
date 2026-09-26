"use client";

import { Check } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { periodLabel, periodOf } from "@/lib/dates";
import { billablePeriods } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import type { PaymentDTO, ProjectDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Last N months for a monthly service: paid / due / overdue / not billed. */
export function MonthGrid({
  project,
  payments,
  months = 12,
  onPay,
}: {
  project: ProjectDTO;
  payments: Pick<PaymentDTO, "period" | "amount">[];
  months?: number;
  onPay?: (period: string) => void;
}) {
  const now = new Date();
  const periods: string[] = [];
  for (let i = months - 1; i >= 0; i--) periods.push(periodOf(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  const billable = new Set(project.status === "planning" ? [] : billablePeriods(project, now));
  const current = periodOf(now);
  const paidBy = new Map<string, number>();
  for (const p of payments) if (p.period) paidBy.set(p.period, (paidBy.get(p.period) ?? 0) + p.amount);

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
      {periods.map((per) => {
        const paid = paidBy.get(per) ?? 0;
        const isPaid = project.monthlyAmount > 0 ? paid >= project.monthlyAmount - 0.009 : paid > 0;
        const due = billable.has(per);
        const state = isPaid ? "paid" : paid > 0 ? "partial" : due ? (per === current ? "due" : "overdue") : "none";
        const label =
          state === "paid"
            ? `Paid ${formatMoney(paid, project.currency)}`
            : state === "partial"
              ? `Partly paid ${formatMoney(paid, project.currency)} of ${formatMoney(project.monthlyAmount, project.currency)}`
              : state === "due"
                ? "Due this month — click to record payment"
                : state === "overdue"
                  ? "Not paid — click to record payment"
                  : "Not billed";
        return (
          <Tooltip key={per}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={!onPay || state === "none"}
                onClick={() => onPay?.(per)}
                className={cn(
                  "flex h-12 flex-col items-center justify-center rounded-lg border text-[11px] font-medium transition-colors",
                  state === "paid" && "border-transparent bg-success/14 text-success",
                  state === "partial" && "border-warning/40 bg-warning/10 text-warning",
                  state === "due" && "border-warning/50 bg-warning/10 text-warning hover:bg-warning/20",
                  state === "overdue" && "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15",
                  state === "none" && "border-dashed text-muted-foreground/60",
                )}
              >
                <span>{periodLabel(per, "MMM")}</span>
                {state === "paid" ? <Check className="size-3.5" /> : <span className="text-[10px] opacity-80">{periodLabel(per, "yy")}</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {periodLabel(per, "MMMM yyyy")} · {label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
