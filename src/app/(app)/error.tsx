"use client";

import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      description={
        error.message?.includes("MONGODB_URI")
          ? "The database isn’t connected. Set MONGODB_URI in your environment (see README)."
          : "Try again. If it keeps happening, check the server logs."
      }
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
