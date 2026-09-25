"use client";

import { Receipt } from "lucide-react";

import { useQuickActions } from "@/components/shell/quick-actions";
import { Button } from "@/components/ui/button";

export function RecordPaymentButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  const quick = useQuickActions();
  return (
    <Button variant={variant} onClick={() => quick.open("payment")}>
      <Receipt /> Payment received
    </Button>
  );
}

export function NewInvoiceButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  const quick = useQuickActions();
  return (
    <Button variant={variant} onClick={() => quick.open("invoice")}>
      <Receipt /> New invoice
    </Button>
  );
}
