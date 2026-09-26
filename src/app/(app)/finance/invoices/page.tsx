import type { Metadata } from "next";

import { InvoicesView } from "@/components/finance/invoices-view";
import { NewInvoiceButton } from "@/components/finance/record-payment-button";
import { PageHeader } from "@/components/page-header";
import { listInvoices } from "@/data/invoices";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const invoices = await listInvoices();
  return (
    <>
      <PageHeader title="Invoices" description="Numbered invoices you can print to PDF. Marking one paid records the payment." actions={<NewInvoiceButton />} />
      <InvoicesView invoices={invoices} />
    </>
  );
}
