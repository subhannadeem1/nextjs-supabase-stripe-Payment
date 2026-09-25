import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvoiceEditor } from "@/components/finance/invoice-editor";
import { getInvoice } from "@/data/invoices";

export async function generateMetadata({ params }: PageProps<"/finance/invoices/[id]">): Promise<Metadata> {
  const { id } = await params;
  const data = await getInvoice(id);
  return { title: data?.invoice.number ?? "Invoice" };
}

export default async function InvoicePage({ params }: PageProps<"/finance/invoices/[id]">) {
  const { id } = await params;
  const data = await getInvoice(id);
  if (!data) notFound();
  // Remount after every save so the form always mirrors what was stored.
  return <InvoiceEditor key={data.invoice.updatedAt} invoice={data.invoice} company={data.company} projects={data.projects} payments={data.payments} />;
}
