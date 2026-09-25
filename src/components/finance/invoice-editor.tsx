"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Plus,
  Printer,
  Save,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";

import { deleteInvoice, markInvoicePaid, setInvoiceStatus, updateInvoice } from "@/actions/invoices";
import { InvoiceStatusBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm";
import { Field, SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, PAYMENT_METHODS, type Currency } from "@/lib/constants";
import { fmtDate, toInputDate, todayInput } from "@/lib/dates";
import { invoiceTotals } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import type { CompanyDTO, InvoiceDTO, PaymentDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";

type ProjectOpt = { _id: string; title: string; currency: string; milestones: { _id: string; title: string; amount: number }[] };

export function InvoiceEditor({
  invoice,
  company,
  projects,
  payments,
}: {
  invoice: InvoiceDTO;
  company: CompanyDTO | null;
  projects: ProjectOpt[];
  payments: PaymentDTO[];
}) {
  const router = useRouter();
  const { pending, run } = useRunAction();
  const initial = useMemo(
    () => ({
      number: invoice.number,
      projectId: invoice.projectId ?? "",
      currency: invoice.currency as Currency,
      issueDate: toInputDate(invoice.issueDate),
      dueDate: toInputDate(invoice.dueDate),
      items: invoice.items.map((i) => ({
        description: i.description,
        quantity: String(i.quantity),
        unitPrice: String(i.unitPrice),
        milestoneId: i.milestoneId ?? "",
      })),
      taxRate: String(invoice.taxRate || ""),
      discount: String(invoice.discount || ""),
      notes: invoice.notes,
    }),
    [invoice],
  );
  const [form, setForm] = useState(initial);
  const [paidOpen, setPaidOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const locked = invoice.status === "paid" || invoice.status === "cancelled";
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setItem = (i: number, k: "description" | "quantity" | "unitPrice", v: string) =>
    setForm((f) => ({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) }));

  const totals = invoiceTotals({
    items: form.items.map((i) => ({ quantity: Number(i.quantity) || 0, unitPrice: Number(i.unitPrice) || 0 })),
    taxRate: Number(form.taxRate) || 0,
    discount: Number(form.discount) || 0,
  });
  const project = projects.find((p) => p._id === form.projectId);
  const overdue = invoice.status === "sent" && invoice.dueDate && new Date(invoice.dueDate) < new Date();

  const payload = () => ({
    number: form.number,
    companyId: invoice.companyId,
    projectId: form.projectId || null,
    currency: form.currency,
    issueDate: form.issueDate,
    dueDate: form.dueDate || null,
    items: form.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity) || 0,
      unitPrice: Number(i.unitPrice) || 0,
      milestoneId: i.milestoneId || null,
    })),
    taxRate: Number(form.taxRate) || 0,
    discount: Number(form.discount) || 0,
    notes: form.notes,
  });
  const save = (then?: () => void) => run(() => updateInvoice(invoice._id, payload()), { success: "Invoice saved", onSuccess: () => then?.() });

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link href="/finance/invoices" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Invoices
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{invoice.number}</h1>
            <InvoiceStatusBadge status={invoice.status} overdue={Boolean(overdue)} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {company ? (
              <Link href={`/marketing/companies/${company._id}`} className="hover:text-primary">
                {company.name}
              </Link>
            ) : (
              "Unknown client"
            )}
            {" · "}
            <span className="font-medium text-foreground tabular-nums">{formatMoney(totals.total, form.currency)}</span>
            {invoice.paidAt ? ` · paid ${fmtDate(invoice.paidAt)}` : invoice.sentAt ? ` · sent ${fmtDate(invoice.sentAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!locked ? (
            <Button variant={dirty ? "default" : "outline"} onClick={() => save()} disabled={pending || !dirty}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />} {dirty ? "Save changes" : "Saved"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              const open = () => window.open(`/print/invoices/${invoice._id}`, "_blank");
              if (dirty && !locked) save(open);
              else open();
            }}
          >
            <Printer /> Print / PDF
          </Button>
          {invoice.status === "draft" ? (
            <Button variant="outline" onClick={() => (dirty ? save(() => run(() => setInvoiceStatus(invoice._id, "sent"), { success: "Marked as sent" })) : run(() => setInvoiceStatus(invoice._id, "sent"), { success: "Marked as sent" }))}>
              <Send /> Mark sent
            </Button>
          ) : null}
          {invoice.status === "draft" || invoice.status === "sent" ? (
            <Button onClick={() => (dirty ? save(() => setPaidOpen(true)) : setPaidOpen(true))}>
              <CheckCircle2 /> Mark paid
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {invoice.status === "sent" ? (
                <DropdownMenuItem onClick={() => run(() => setInvoiceStatus(invoice._id, "draft"), { success: "Back to draft" })}>
                  <Undo2 /> Back to draft
                </DropdownMenuItem>
              ) : null}
              {invoice.status !== "cancelled" && invoice.status !== "paid" ? (
                <DropdownMenuItem onClick={() => run(() => setInvoiceStatus(invoice._id, "cancelled"), { success: "Invoice cancelled" })}>
                  <Ban /> Cancel invoice
                </DropdownMenuItem>
              ) : null}
              {invoice.status === "cancelled" ? (
                <DropdownMenuItem onClick={() => run(() => setInvoiceStatus(invoice._id, "draft"), { success: "Restored as draft" })}>
                  <Undo2 /> Restore as draft
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {locked ? (
        <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {invoice.status === "paid"
            ? "This invoice is paid, so it’s locked. Delete its payment to reopen it."
            : "This invoice is cancelled. Restore it as a draft to edit."}
        </p>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            {!locked && project?.milestones.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="soft">
                    Add milestone <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{project.title}</DropdownMenuLabel>
                  {project.milestones.map((m) => (
                    <DropdownMenuItem
                      key={m._id}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          items: [
                            ...f.items.filter((i) => i.description || Number(i.unitPrice)),
                            { description: `${project.title} — ${m.title}`, quantity: "1", unitPrice: String(m.amount), milestoneId: m._id },
                          ],
                        }))
                      }
                    >
                      {m.title} · {formatMoney(m.amount, project.currency)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="hidden grid-cols-[1fr_80px_120px_110px_32px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit price</span>
              <span className="text-right">Amount</span>
              <span />
            </div>
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_32px] gap-2 rounded-xl border p-2 sm:grid-cols-[1fr_80px_120px_110px_32px] sm:items-center sm:border-0 sm:p-0">
                <Input value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} placeholder="What you delivered" disabled={locked} className="col-span-1" aria-label="Description" />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="sm:order-last"
                  aria-label="Remove line"
                  disabled={locked || form.items.length === 1}
                  onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                >
                  <Trash2 />
                </Button>
                <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-3 sm:grid-cols-[80px_120px_110px]">
                  <Input type="number" min={0} step="any" value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} disabled={locked} aria-label="Quantity" />
                  <Input type="number" step="0.01" value={it.unitPrice} onChange={(e) => setItem(i, "unitPrice", e.target.value)} disabled={locked} aria-label="Unit price" />
                  <div className="flex items-center justify-end text-sm font-medium tabular-nums">
                    {formatMoney((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), form.currency)}
                  </div>
                </div>
              </div>
            ))}
            {!locked ? (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setForm((f) => ({ ...f, items: [...f.items, { description: "", quantity: "1", unitPrice: "", milestoneId: "" }] }))}
              >
                <Plus /> Add line
              </Button>
            ) : null}
            <div className="ml-auto grid w-full max-w-xs gap-1.5 border-t pt-3 text-sm">
              <Row label="Subtotal" value={formatMoney(totals.subtotal, form.currency)} />
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Discount</span>
                <Input type="number" min={0} step="0.01" value={form.discount} onChange={(e) => set("discount", e.target.value)} className="h-8 w-28 text-right" disabled={locked} placeholder="0" aria-label="Discount" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Tax / VAT %</span>
                <Input type="number" min={0} max={100} step="0.1" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} className="h-8 w-28 text-right" disabled={locked} placeholder="0" aria-label="Tax / VAT %" />
              </div>
              {totals.tax ? <Row label="Tax" value={formatMoney(totals.tax, form.currency)} /> : null}
              <div className="mt-1 flex items-center justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(totals.total, form.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Field label="Invoice number">
                <Input value={form.number} onChange={(e) => set("number", e.target.value)} disabled={locked} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Issue date">
                  <Input type="date" value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} disabled={locked} />
                </Field>
                <Field label="Due date">
                  <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} disabled={locked} />
                </Field>
              </div>
              <Field label="Currency">
                <SelectField value={form.currency} onChange={(v) => set("currency", (v || "EUR") as Currency)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
              </Field>
              {projects.length ? (
                <Field label="Project">
                  <SelectField
                    value={form.projectId}
                    onChange={(v) => set("projectId", v)}
                    options={projects.map((p) => ({ value: p._id, label: p.title }))}
                    allowEmpty
                    emptyLabel="No project"
                    placeholder="No project"
                  />
                </Field>
              ) : null}
              <Field label="Notes on invoice">
                <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} disabled={locked} placeholder="Leave empty to use the default from Settings" />
              </Field>
            </CardContent>
          </Card>
          {payments.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1 text-sm">
                {payments.map((p) => (
                  <div key={p._id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {fmtDate(p.date)}
                      {p.method ? ` · ${p.method}` : ""}
                    </span>
                    <span className="font-medium text-success tabular-nums">{formatMoney(p.amount, p.currency)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {paidOpen ? <MarkPaidDialog invoiceId={invoice._id} total={formatMoney(totals.total, form.currency)} onClose={() => setPaidOpen(false)} /> : null}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${invoice.number}?`}
        description="Any payment recorded for it stays, just unlinked."
        onConfirm={() => run(() => deleteInvoice(invoice._id), { success: "Invoice deleted", onSuccess: () => router.push("/finance/invoices") })}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function MarkPaidDialog({ invoiceId, total, onClose }: { invoiceId: string; total: string; onClose: () => void }) {
  const { pending, run } = useRunAction();
  const [date, setDate] = useState(todayInput());
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as paid</DialogTitle>
          <DialogDescription>A payment of {total} will be recorded for this client.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => markInvoicePaid(invoiceId, { date, method, reference }), { success: "Invoice paid 🎉", onSuccess: onClose });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date received">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="Method">
              <SelectField value={method} onChange={setMethod} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} allowEmpty emptyLabel="Not set" placeholder="Not set" />
            </Field>
          </div>
          <Field label="Reference (optional)">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction ID" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
