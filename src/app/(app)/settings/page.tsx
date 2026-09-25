import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/data/settings";
import { requirePageAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [session, settings] = await Promise.all([requirePageAuth(), getSettings()]);
  return (
    <>
      <PageHeader title="Settings" description="Your business details, defaults, invoices and backups." />
      <div className="max-w-4xl">
        <SettingsForm settings={settings} email={session.email} />
      </div>
    </>
  );
}
