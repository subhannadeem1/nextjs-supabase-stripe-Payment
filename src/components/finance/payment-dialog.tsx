"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { listCompanyOptions } from "@/actions/companies";
import { recordPayment, updatePayment } from "@/actions/payments";
import { listProjectOptions } from "@/actions/projects";
import { Combobox, Field, SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CURRENCIES, PAYMENT_METHODS, type Currency } from "@/lib/constants";
import { periodOf, toInputDate, todayInput } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { PaymentDTO } from "@/lib/types";
import { useOptions } from "@/lib/use-options";
import { useRunAction } from "@/lib/use-action";

export function PaymentDialog({
  open,
  onOpenChange,
  presetProjectId,
  presetCompanyId,
  presetMilestoneId,
  presetPeriod,
  presetAmount,
  payment,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetProjectId?: string;
  presetCompanyId?: string;
  presetMilestoneId?: string;
  presetPeriod?: string;
  presetAmount?: number;
  payment?: PaymentDTO;
}) {
  const { pending, run } = useRunAction();
  const { options: projects, loading } = useOptions(listProjectOptions, open);
  const { options: companies } = useOptions(listCompanyOptions, open);
  const [form, setForm] = useState({
    projectId: payment?.projectId ?? presetProjectId ?? "",
    companyId: payment?.companyId ?? presetCompanyId ?? "",
    milestoneId: payment?.milestoneId ?? presetMilestoneId ?? "",
    period: payment?.period ?? presetPeriod ?? "",
    amount: payment ? String(payment.amount) : presetAmount ? String(presetAmount) : "",
    currency: (payment?.currency ?? "EUR") as Currency,
    date: payment ? toInputDate(payment.date) : todayInput(),
    method: payment?.method ?? "",
    reference: payment?.reference ?? "",
    note: payment?.note ?? "",
  });
  const [touchedAmount, setTouchedAmount] = useState(Boolean(payment || presetAmount));
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const project = projects.find((p) => p.value === form.projectId);
  const milestone = project?.milestones.find((m) => m.value === form.milestoneId);

  // Defaults come from the chosen project until you type your own values.
  const currency = (project?.currency as Currency | undefined) ?? form.currency;
  const period = project?.billing === "monthly" ? form.period || periodOf(new Date()) : "";
  const suggestedAmount = milestone
    ? String(milestone.remaining || milestone.amount)
    : project?.billing === "monthly" && project.monthlyAmount
      ? String(project.monthlyAmount)
      : "";
  const amount = touchedAmount ? form.amount : suggestedAmount || form.amount;

  const submit = () => {
    const payload = {
      projectId: form.projectId || null,
      companyId: project?.companyId ?? (form.companyId || null),
      milestoneId: form.milestoneId || null,
      invoiceId: payment?.invoiceId ?? null,
      amount: Number(amount),
      currency,
      date: form.date,
      method: form.method,
      period,
      reference: form.reference,
      note: form.note,
    };
    run(() => (payment ? updatePayment(payment._id, payload) : recordPayment(payload)), {
      success: payment ? "Payment updated" : `Payment of ${formatMoney(payload.amount, payload.currency)} recorded`,
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit payment" : "Payment received"}</DialogTitle>
          <DialogDescription>Money that actually arrived in your account.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Project">
            <Combobox
              value={form.projectId}
              onChange={(v) => {
                set("projectId", v);
                set("milestoneId", "");
                if (!v) set("period", "");
              }}
              options={projects.map((p) => ({ value: p.value, label: `${p.label} · ${p.companyName}`, keywords: [p.companyName] }))}
              placeholder={loading ? "Loading…" : "Pick a project (or leave empty)"}
              searchPlaceholder="Search projects…"
            />
          </Field>
          {!form.projectId ? (
            <Field label="Client">
              <Combobox
                value={form.companyId}
                onChange={(v) => set("companyId", v)}
                options={companies.map((c) => ({ value: c.value, label: c.label }))}
                placeholder="Pick a client"
                allowClear={false}
              />
            </Field>
          ) : null}
          {project?.milestones.length ? (
            <Field label="For milestone">
              <SelectField
                value={form.milestoneId}
                onChange={(v) => set("milestoneId", v)}
                options={project.milestones.map((m) => ({
                  value: m.value,
                  label: `${m.label} · ${formatMoney(m.remaining, project.currency)} left`,
                }))}
                allowEmpty
                emptyLabel="Not for a milestone"
                placeholder="Not for a milestone"
              />
            </Field>
          ) : null}
          {project?.billing === "monthly" ? (
            <Field label="For month">
              <Input type="month" value={period} onChange={(e) => set("period", e.target.value)} required />
            </Field>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
            <Field label="Amount">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={amount}
                onChange={(e) => {
                  setTouchedAmount(true);
                  set("amount", e.target.value);
                }}
                required
                autoFocus
              />
            </Field>
            <Field label="Currency">
              {project ? (
                <Input value={currency} disabled />
              ) : (
                <SelectField
                  value={form.currency}
                  onChange={(v) => set("currency", (v || "EUR") as Currency)}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date received">
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </Field>
            <Field label="Method">
              <SelectField
                value={form.method}
                onChange={(v) => set("method", v)}
                options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
                allowEmpty
                emptyLabel="Not set"
                placeholder="Bank, Wise, PayPal…"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reference">
              <Input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="Transaction ID / invoice #" />
            </Field>
            <Field label="Note">
              <Input value={form.note} onChange={(e) => set("note", e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !amount || (!form.projectId && !form.companyId)}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {payment ? "Save" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
