import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { RecordPaymentButton } from "@/components/finance/record-payment-button";
import { PageHeader } from "@/components/page-header";
import { PaymentsList } from "@/components/projects/payments-list";
import { listPayments } from "@/data/invoices";
import { getSettings } from "@/data/settings";
import { periodLabel, periodOf } from "@/lib/dates";
import { formatMoneyMap, sumByCurrency } from "@/lib/money";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const [payments, settings] = await Promise.all([listPayments(), getSettings()]);
  const groups = new Map<string, typeof payments>();
  for (const p of payments) {
    const k = periodOf(new Date(p.date));
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }
  return (
    <>
      <PageHeader title="Payments" description="Every payment you’ve received, month by month." actions={<RecordPaymentButton />} />
      {payments.length === 0 ? (
        <EmptyState icon={Receipt} title="No payments yet" description="Record money as it arrives — from a project, a monthly service or an invoice." />
      ) : (
        <div className="grid gap-5">
          {[...groups.entries()].map(([period, list]) => (
            <section key={period} className="rounded-xl border bg-card px-5 pt-4 pb-2">
              <header className="flex items-center justify-between border-b pb-3">
                <h2 className="font-semibold">{periodLabel(period, "MMMM yyyy")}</h2>
                <span className="text-sm font-semibold text-success tabular-nums">
                  {formatMoneyMap(sumByCurrency(list, (p) => p.currency, (p) => p.amount), settings.defaultCurrency)}
                </span>
              </header>
              <PaymentsList payments={list} showClient />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
