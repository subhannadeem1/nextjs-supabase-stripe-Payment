import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Not found"
      description="This page or record doesn’t exist anymore."
      action={
        <Button asChild>
          <Link href="/">Back to Today</Link>
        </Button>
      }
    />
  );
}
