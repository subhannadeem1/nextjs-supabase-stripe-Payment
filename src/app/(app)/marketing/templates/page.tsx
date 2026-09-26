import type { Metadata } from "next";

import { TemplatesView } from "@/components/library/templates-view";
import { PageHeader } from "@/components/page-header";
import { listTemplates } from "@/data/library";
import { getSettings } from "@/data/settings";

export const metadata: Metadata = { title: "Message templates" };

export default async function TemplatesPage() {
  const [templates, settings] = await Promise.all([listTemplates(), getSettings()]);
  return (
    <>
      <PageHeader title="Message templates" description="Your proposals and follow-ups, ready to personalise in one click." />
      <TemplatesView templates={templates} me={{ ownerName: settings.ownerName, businessName: settings.businessName }} />
    </>
  );
}
