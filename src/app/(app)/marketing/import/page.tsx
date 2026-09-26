import type { Metadata } from "next";

import { ImportView } from "@/components/library/import-view";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Import CSV" };

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import companies"
        description="Bring in your Notion export or any list. Duplicates are matched by website and name — never added twice."
      />
      <ImportView />
    </>
  );
}
