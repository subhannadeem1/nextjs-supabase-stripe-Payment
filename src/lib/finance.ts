import { periodOf, periodsBetween } from "@/lib/dates";
import { round2 } from "@/lib/money";
import type { ProjectFinance } from "@/lib/types";

type ProjectLike = {
  billing: string;
  status: string;
  value?: number | null;
  monthlyAmount?: number | null;
  billingDay?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  createdAt?: Date | string | null;
};

type PaymentLike = { amount: number; period?: string | null };

/** Month periods a monthly service has been billable for, up to today. */
export function billablePeriods(p: ProjectLike, now = new Date()) {
  const start = p.startDate ? new Date(p.startDate) : p.createdAt ? new Date(p.createdAt) : null;
  if (!start) return [];
  let end = now;
  if (p.endDate && new Date(p.endDate) < end) end = new Date(p.endDate);
  if (start > end) return [];
  const periods = periodsBetween(start, end);
  // The current month only becomes due on its billing day.
  const current = periodOf(now);
  const day = Math.min(Math.max(p.billingDay ?? 1, 1), 28);
  if (periods[periods.length - 1] === current && now.getDate() < day) periods.pop();
  return periods;
}

export function computeProjectFinance(p: ProjectLike, payments: PaymentLike[], now = new Date()): ProjectFinance {
  const received = round2(payments.reduce((s, x) => s + (x.amount || 0), 0));
  if (p.billing === "monthly") {
    const amount = p.monthlyAmount || 0;
    const periods = p.status === "planning" ? [] : billablePeriods(p, now);
    const paidByPeriod = new Map<string, number>();
    for (const pay of payments) {
      if (pay.period) paidByPeriod.set(pay.period, (paidByPeriod.get(pay.period) ?? 0) + pay.amount);
    }
    const unpaidPeriods = amount > 0 ? periods.filter((per) => (paidByPeriod.get(per) ?? 0) < amount - 0.009) : [];
    const expected = round2(periods.length * amount);
    return {
      expected,
      received,
      pending: p.status === "cancelled" ? 0 : Math.max(0, round2(expected - received)),
      unpaidPeriods: p.status === "cancelled" ? [] : unpaidPeriods,
    };
  }
  const expected = round2(p.value || 0);
  return {
    expected,
    received,
    pending: p.status === "cancelled" ? 0 : Math.max(0, round2(expected - received)),
    unpaidPeriods: [],
  };
}

export function invoiceTotals(inv: { items: { quantity: number; unitPrice: number }[]; taxRate?: number; discount?: number }) {
  const subtotal = round2(inv.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0));
  const discount = round2(Math.min(inv.discount || 0, subtotal));
  const taxable = subtotal - discount;
  const tax = round2((taxable * (inv.taxRate || 0)) / 100);
  return { subtotal, discount, tax, total: round2(taxable + tax) };
}
