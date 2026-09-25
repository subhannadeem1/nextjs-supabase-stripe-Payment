import type { Metadata } from "next";

import { DemosView } from "@/components/library/demos-view";
import { PageHeader } from "@/components/page-header";
import { listDemos } from "@/data/library";

export const metadata: Metadata = { title: "Demo library" };

export default async function DemosPage() {
  const demos = await listDemos();
  return (
    <>
      <PageHeader title="Demo library" description="Every demo you send — and exactly who received it." />
      <DemosView demos={demos} />
    </>
  );
}
