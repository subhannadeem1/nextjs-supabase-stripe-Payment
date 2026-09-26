"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { NewInvoiceDialog } from "@/components/finance/new-invoice-dialog";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { TaskDialog } from "@/components/tasks/task-dialog";

export type QuickKind = "company" | "project" | "task" | "payment" | "invoice";
export type QuickPreset = { companyId?: string; projectId?: string };

type Ctx = { open: (kind: QuickKind, preset?: QuickPreset) => void };
const QuickActionsContext = createContext<Ctx>({ open: () => {} });

export function useQuickActions() {
  return useContext(QuickActionsContext);
}

export function QuickActionsProvider({
  children,
  defaultCurrency,
}: {
  children: React.ReactNode;
  defaultCurrency: string;
}) {
  const [state, setState] = useState<{ kind: QuickKind | null; preset: QuickPreset; key: number }>({
    kind: null,
    preset: {},
    key: 0,
  });
  const open = useCallback(
    (kind: QuickKind, preset: QuickPreset = {}) => setState((s) => ({ kind, preset, key: s.key + 1 })),
    [],
  );
  const close = (o: boolean) => {
    if (!o) setState((s) => ({ ...s, kind: null }));
  };
  const value = useMemo(() => ({ open }), [open]);

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
      <AddCompanyDialog key={`c${state.key}`} open={state.kind === "company"} onOpenChange={close} />
      <ProjectDialog
        key={`p${state.key}`}
        open={state.kind === "project"}
        onOpenChange={close}
        presetCompanyId={state.preset.companyId}
        defaultCurrency={defaultCurrency}
      />
      <TaskDialog
        key={`t${state.key}`}
        open={state.kind === "task"}
        onOpenChange={close}
        presetCompanyId={state.preset.companyId}
        presetProjectId={state.preset.projectId}
      />
      <PaymentDialog
        key={`pay${state.key}`}
        open={state.kind === "payment"}
        onOpenChange={close}
        presetProjectId={state.preset.projectId}
        presetCompanyId={state.preset.companyId}
      />
      <NewInvoiceDialog
        key={`i${state.key}`}
        open={state.kind === "invoice"}
        onOpenChange={close}
        presetCompanyId={state.preset.companyId}
        presetProjectId={state.preset.projectId}
        defaultCurrency={defaultCurrency}
      />
    </QuickActionsContext.Provider>
  );
}
