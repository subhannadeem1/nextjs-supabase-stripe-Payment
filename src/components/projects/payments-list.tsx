"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { deletePayment } from "@/actions/payments";
import { ConfirmDialog } from "@/components/confirm";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmtDate, periodLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { PaymentDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";

export function PaymentsList({
  payments,
  milestoneNames,
  showClient,
  empty = "No payments recorded yet.",
}: {
  payments: PaymentDTO[];
  milestoneNames?: Record<string, string>;
  showClient?: boolean;
  empty?: string;
}) {
  const { run } = useRunAction();
  const [editing, setEditing] = useState<PaymentDTO | null>(null);
  const [toDelete, setToDelete] = useState<PaymentDTO | null>(null);
  if (!payments.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <>
      <ul className="grid divide-y">
        {payments.map((p) => (
          <li key={p._id} className="flex items-center gap-3 py-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/12 text-xs font-semibold text-success">
              {fmtDate(p.date, "d")}
              <span className="-mt-1 text-[9px] font-medium uppercase">{fmtDate(p.date, "MMM")}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {showClient && p.company ? (
                  <Link href={`/marketing/companies/${p.company._id}`} className="hover:text-primary">
                    {p.company.name}
                  </Link>
                ) : null}
                {showClient && p.project ? (
                  <Link href={`/projects/${p.project._id}`} className="text-muted-foreground hover:text-primary">
                    {" "}· {p.project.title}
                  </Link>
                ) : null}
                {!showClient
                  ? [p.period ? periodLabel(p.period, "MMMM yyyy") : "", p.milestoneId && milestoneNames?.[p.milestoneId]].filter(Boolean).join(" · ") ||
                    "Payment"
                  : null}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {[fmtDate(p.date), p.method, p.reference, showClient && p.period ? periodLabel(p.period, "MMM yyyy") : ""].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div className="text-sm font-semibold text-success tabular-nums">+{formatMoney(p.amount, p.currency)}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost" aria-label="Payment actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(p)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setToDelete(p)}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
      {editing ? <PaymentDialog open onOpenChange={(o) => !o && setEditing(null)} payment={editing} /> : null}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this payment?"
        description={toDelete?.invoiceId ? "The invoice it paid will go back to “Sent”." : undefined}
        onConfirm={() => toDelete && run(() => deletePayment(toDelete._id), { success: "Payment deleted" })}
      />
    </>
  );
}
