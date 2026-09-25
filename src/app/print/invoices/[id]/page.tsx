import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getInvoice } from "@/data/invoices";
import { getSettings } from "@/data/settings";
import { requirePageAuth } from "@/lib/auth";
import { countryName } from "@/lib/countries";
import { fmtDate } from "@/lib/dates";
import { invoiceTotals } from "@/lib/finance";
import { formatMoney } from "@/lib/money";

import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/print/invoices/[id]">): Promise<Metadata> {
  const { id } = await params;
  const data = await getInvoice(id);
  // The title becomes the default PDF file name.
  return { title: { absolute: data ? `${data.invoice.number} — ${data.company?.name ?? "Invoice"}` : "Invoice" } };
}

export default async function PrintInvoicePage({ params }: PageProps<"/print/invoices/[id]">) {
  await requirePageAuth();
  const { id } = await params;
  const [data, s] = await Promise.all([getInvoice(id), getSettings()]);
  if (!data) notFound();
  const { invoice: inv, company } = data;
  const t = invoiceTotals(inv);
  const cur = inv.currency;
  const contact = company?.contacts.find((c) => c.decisionMaker) ?? company?.contacts[0];
  const notes = inv.notes || s.invoiceNotes;

  return (
    <div className="min-h-dvh bg-neutral-100 py-8 text-neutral-900 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 14mm; } html, body { background: white; color-scheme: light; }`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <span className="text-sm text-neutral-500">Tip: in the print dialog choose “Save as PDF”.</span>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-[210mm] bg-white p-[14mm] shadow-xl print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="grid size-11 place-items-center rounded-xl text-lg font-bold text-white print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]"
                style={{ backgroundImage: "linear-gradient(120deg,#6c63f5,#4fc3f7)" }}
              >
                {(s.businessName || "B").charAt(0)}
              </span>
              <div>
                <div className="text-lg font-semibold">{s.businessName}</div>
                {s.ownerName ? <div className="text-sm text-neutral-500">{s.ownerName}</div> : null}
              </div>
            </div>
            <div className="mt-3 text-sm leading-relaxed whitespace-pre-line text-neutral-600">
              {[s.address, s.email, s.phone, s.website, s.taxId ? `Tax ID: ${s.taxId}` : ""].filter(Boolean).join("\n")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold tracking-tight">INVOICE</div>
            <div className="mt-1 text-sm text-neutral-500">{inv.number}</div>
            {inv.status === "paid" ? (
              <div className="mt-3 inline-block rounded-md border-2 border-emerald-600 px-3 py-1 text-sm font-bold tracking-widest text-emerald-700">
                PAID
              </div>
            ) : null}
          </div>
        </header>

        <section className="mt-10 grid grid-cols-2 gap-8 text-sm">
          <div>
            <div className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Bill to</div>
            <div className="mt-1.5 text-base font-semibold">{company?.name}</div>
            <div className="leading-relaxed text-neutral-600">
              {contact ? (
                <>
                  {contact.name}
                  {contact.role ? `, ${contact.role}` : ""}
                  <br />
                </>
              ) : null}
              {contact?.email ? (
                <>
                  {contact.email}
                  <br />
                </>
              ) : null}
              {[company?.city, countryName(company?.country)].filter(Boolean).join(", ")}
            </div>
          </div>
          <dl className="grid content-start gap-1.5 justify-self-end text-right">
            <div className="flex justify-end gap-6">
              <dt className="text-neutral-500">Issue date</dt>
              <dd className="w-28 font-medium">{fmtDate(inv.issueDate)}</dd>
            </div>
            {inv.dueDate ? (
              <div className="flex justify-end gap-6">
                <dt className="text-neutral-500">Due date</dt>
                <dd className="w-28 font-medium">{fmtDate(inv.dueDate)}</dd>
              </div>
            ) : null}
            {data.project ? (
              <div className="flex justify-end gap-6">
                <dt className="text-neutral-500">Project</dt>
                <dd className="w-28 font-medium">{data.project.title}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-neutral-900 text-left text-xs tracking-wider text-neutral-500 uppercase">
              <th className="py-2 font-semibold">Description</th>
              <th className="w-16 py-2 text-right font-semibold">Qty</th>
              <th className="w-32 py-2 text-right font-semibold">Unit price</th>
              <th className="w-32 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it) => (
              <tr key={it._id} className="border-b border-neutral-200">
                <td className="py-3 pr-4">{it.description}</td>
                <td className="py-3 text-right tabular-nums">{it.quantity}</td>
                <td className="py-3 text-right tabular-nums">{formatMoney(it.unitPrice, cur)}</td>
                <td className="py-3 text-right font-medium tabular-nums">{formatMoney(it.quantity * it.unitPrice, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-6 ml-auto grid w-72 gap-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span className="tabular-nums">{formatMoney(t.subtotal, cur)}</span>
          </div>
          {t.discount ? (
            <div className="flex justify-between">
              <span className="text-neutral-500">Discount</span>
              <span className="tabular-nums">−{formatMoney(t.discount, cur)}</span>
            </div>
          ) : null}
          {inv.taxRate ? (
            <div className="flex justify-between">
              <span className="text-neutral-500">Tax ({inv.taxRate}%)</span>
              <span className="tabular-nums">{formatMoney(t.tax, cur)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t-2 border-neutral-900 pt-2 text-lg font-semibold">
            <span>Total due</span>
            <span className="tabular-nums">{formatMoney(inv.status === "paid" ? 0 : t.total, cur)}</span>
          </div>
          {inv.status === "paid" ? (
            <div className="text-right text-xs text-emerald-700">
              {formatMoney(t.total, cur)} paid on {fmtDate(inv.paidAt)}
            </div>
          ) : null}
        </section>

        {s.paymentDetails || notes ? (
          <footer className="mt-12 grid gap-6 border-t border-neutral-200 pt-6 text-sm sm:grid-cols-2">
            {s.paymentDetails ? (
              <div>
                <div className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Payment details</div>
                <p className="mt-1.5 leading-relaxed whitespace-pre-line text-neutral-700">{s.paymentDetails}</p>
              </div>
            ) : null}
            {notes ? (
              <div>
                <div className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Notes</div>
                <p className="mt-1.5 leading-relaxed whitespace-pre-line text-neutral-700">{notes}</p>
              </div>
            ) : null}
          </footer>
        ) : null}
      </article>
    </div>
  );
}
