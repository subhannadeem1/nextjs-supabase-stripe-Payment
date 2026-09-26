"use client";

import { useState } from "react";
import Link from "next/link";
import { Repeat } from "lucide-react";

import { ProjectStatusBadge } from "@/components/badges";
import { CompanyLogo } from "@/components/company-logo";
import { EmptyState } from "@/components/empty-state";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { formatMoney } from "@/lib/money";
import type { PaymentDTO, ProjectDTO } from "@/lib/types";

import { MonthGrid } from "./month-grid";
import { NewProjectButton } from "./new-project-button";

export function ServicesView({
  services,
  payments,
}: {
  services: ProjectDTO[];
  payments: Pick<PaymentDTO, "projectId" | "period" | "amount">[];
}) {
  const [pay, setPay] = useState<{ key: number; projectId: string; period: string; amount: number } | null>(null);

  if (!services.length) {
    return (
      <EmptyState
        icon={Repeat}
        title="No monthly services yet"
        description="Create a project with billing “Monthly service” — each month shows here as paid, due or late."
        action={<NewProjectButton />}
      />
    );
  }
  return (
    <div className="grid gap-4">
      {services.map((p) => (
        <div key={p._id} className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <CompanyLogo name={p.company?.name ?? "?"} domain={p.company?.domain} className="size-10 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Link href={`/projects/${p._id}`} className="block truncate font-medium hover:text-primary">
                {p.title}
              </Link>
              <div className="truncate text-xs text-muted-foreground">
                {p.company?.name} · billed on day {p.billingDay}
              </div>
            </div>
            <ProjectStatusBadge status={p.status} />
            <div className="text-right">
              <div className="font-semibold tabular-nums">{formatMoney(p.monthlyAmount, p.currency)}/mo</div>
              {p.finance && p.finance.pending > 0 ? (
                <div className="text-xs font-medium text-warning tabular-nums">{formatMoney(p.finance.pending, p.currency)} pending</div>
              ) : (
                <div className="text-xs text-success">Up to date</div>
              )}
            </div>
          </div>
          <MonthGrid
            project={p}
            payments={payments.filter((x) => x.projectId === p._id)}
            onPay={(period) => setPay({ key: Date.now(), projectId: p._id, period, amount: p.monthlyAmount })}
          />
        </div>
      ))}
      {pay ? (
        <PaymentDialog
          key={pay.key}
          open
          onOpenChange={(o) => !o && setPay(null)}
          presetProjectId={pay.projectId}
          presetPeriod={pay.period}
          presetAmount={pay.amount}
        />
      ) : null}
    </div>
  );
}
