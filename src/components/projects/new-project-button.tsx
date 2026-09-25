"use client";

import { Plus } from "lucide-react";

import { useQuickActions } from "@/components/shell/quick-actions";
import { Button } from "@/components/ui/button";

export function NewProjectButton() {
  const quick = useQuickActions();
  return (
    <Button onClick={() => quick.open("project")}>
      <Plus /> New project
    </Button>
  );
}
