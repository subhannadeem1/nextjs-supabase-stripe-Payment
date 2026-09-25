"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";

import { InvoiceStatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { fmtDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { InvoiceDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

import { NewInvoiceButton } from "./record-payment-button";

type Row = InvoiceDTO & { total: number; overdue: boolean };
const TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Sent" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function inTab(r: Row, t: Tab) {
  if (t === "all") return true;
  if (t === "overdue") return r.overdue;
  return r.status === t;
}

export function InvoicesView({ invoices }: { invoices: Row[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const visible = useMemo(() => {
    const text = q.trim().toLowerCase();
    return invoices.filter(
      (r) =>
        inTab(r, tab) && (!text || `${r.number} ${r.company?.name ?? ""} ${r.project?.title ?? ""}`.toLowerCase().includes(text)),
    );
  }, [invoices, tab, q]);

  if (!invoices.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No invoices yet"
        description="Create a numbered invoice, print it to PDF, and mark it paid — the payment is recorded for you."
        action={<NewInvoiceButton />}
      />
    );
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium",
                tab === t.key ? "border-transparent bg-brand text-white shadow-brand" : "bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-[11px]", tab === t.key ? "bg-white/25" : "bg-muted")}>
                {invoices.filter((r) => inTab(r, t.key)).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number, client, project…" className="pl-9" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-3 py-2.5">Client</th>
                <th className="hidden px-3 py-2.5 md:table-cell">Project</th>
                <th className="px-3 py-2.5">Issued</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Due</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r._id} onClick={() => router.push(`/finance/invoices/${r._id}`)} className="cursor-pointer border-b last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    <Link href={`/finance/invoices/${r._id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">
                      {r.number}
                    </Link>
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-3">{r.company?.name}</td>
                  <td className="hidden max-w-[200px] truncate px-3 py-3 text-muted-foreground md:table-cell">{r.project?.title ?? "—"}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.issueDate, "d MMM yy")}</td>
                  <td className={cn("hidden px-3 py-3 whitespace-nowrap sm:table-cell", r.overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                    {r.dueDate ? fmtDate(r.dueDate, "d MMM yy") : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <InvoiceStatusBadge status={r.status} overdue={r.overdue} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{formatMoney(r.total, r.currency)}</td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nothing here.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
