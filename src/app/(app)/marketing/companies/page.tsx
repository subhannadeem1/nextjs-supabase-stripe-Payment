import type { Metadata } from "next";

import { AddCompanyButton } from "@/components/companies/add-company-button";
import { CompaniesView } from "@/components/companies/companies-view";
import { VIEWS, type ViewKey } from "@/components/companies/views";
import { PageHeader } from "@/components/page-header";
import { listCompanyRows } from "@/data/companies";

export const metadata: Metadata = { title: "Client hunting" };

export default async function CompaniesPage({ searchParams }: PageProps<"/marketing/companies">) {
  const { view } = await searchParams;
  const rows = await listCompanyRows();
  const initialView = VIEWS.some((v) => v.key === view) ? (view as ViewKey) : "all";
  return (
    <>
      <PageHeader
        title="Client hunting"
        description="Every racking company you’ve found — who you approached, where, and what happens next."
        actions={<AddCompanyButton />}
      />
      <CompaniesView rows={rows} initialView={initialView} />
    </>
  );
}
