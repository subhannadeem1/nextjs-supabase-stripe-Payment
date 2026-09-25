import type { Metadata } from "next";
import { BellRing } from "lucide-react";

import { FollowUpGroup } from "@/components/companies/follow-up-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getFollowUps, getForgotten } from "@/data/dashboard";
import { daysFromToday } from "@/lib/dates";

export const metadata: Metadata = { title: "Follow-ups" };

export default async function FollowUpsPage() {
  const [rows, forgotten] = await Promise.all([getFollowUps(), getForgotten()]);
  const bucket = (min: number, max: number) =>
    rows.filter((r) => {
      const d = daysFromToday(r.followUpAt) ?? 0;
      return d >= min && d <= max;
    });
  const overdue = bucket(-100000, -1);
  const today = bucket(0, 0);
  const week = bucket(1, 7);
  const later = bucket(8, 100000);

  return (
    <>
      <PageHeader
        title="Follow-ups"
        description="Who to chase today, and who’s gone quiet without a plan."
      />
      {rows.length === 0 && forgotten.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="Nothing to chase"
          description="When you log outreach, set a follow-up date — it shows up here on the right day."
        />
      ) : (
        <div className="grid gap-8">
          <FollowUpGroup title="Overdue" tone="danger" rows={overdue} />
          <FollowUpGroup title="Today" tone="warning" rows={today} />
          <FollowUpGroup title="Next 7 days" rows={week} />
          <FollowUpGroup title="Later" rows={later} />
          <FollowUpGroup title="Going cold — contacted 10+ days ago, no follow-up planned" rows={forgotten} showLastContact />
        </div>
      )}
    </>
  );
}
