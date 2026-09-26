"use client";

import { Plus } from "lucide-react";

import { useQuickActions } from "@/components/shell/quick-actions";
import { Button } from "@/components/ui/button";

export function AddCompanyButton() {
  const quick = useQuickActions();
  return (
    <Button onClick={() => quick.open("company")}>
      <Plus /> Add company
    </Button>
  );
}
