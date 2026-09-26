import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyDetail } from "@/components/companies/company-detail";
import { getCompanyDetail } from "@/data/companies";
import { getSettings } from "@/data/settings";

export async function generateMetadata({ params }: PageProps<"/marketing/companies/[id]">): Promise<Metadata> {
  const { id } = await params;
  const data = await getCompanyDetail(id);
  return { title: data?.company.name ?? "Company" };
}

export default async function CompanyPage({ params }: PageProps<"/marketing/companies/[id]">) {
  const { id } = await params;
  const [data, settings] = await Promise.all([getCompanyDetail(id), getSettings()]);
  if (!data) notFound();
  return <CompanyDetail data={data} settings={settings} />;
}
