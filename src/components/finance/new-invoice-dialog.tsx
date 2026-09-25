"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { listCompanyOptions } from "@/actions/companies";
import { createInvoice } from "@/actions/invoices";
import { listProjectOptions } from "@/actions/projects";
import { Combobox, Field, SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CURRENCIES } from "@/lib/constants";
import { useOptions } from "@/lib/use-options";
import { useRunAction } from "@/lib/use-action";

export function NewInvoiceDialog({
  open,
  onOpenChange,
  presetCompanyId,
  presetProjectId,
  defaultCurrency,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetCompanyId?: string;
  presetProjectId?: string;
  defaultCurrency: string;
}) {
  const router = useRouter();
  const { pending, run } = useRunAction();
  const { options: companies, loading } = useOptions(listCompanyOptions, open);
  const { options: projects } = useOptions(listProjectOptions, open);
  const [companyId, setCompanyId] = useState(presetCompanyId ?? "");
  const [projectId, setProjectId] = useState(presetProjectId ?? "");
  const [currency, setCurrency] = useState(defaultCurrency || "EUR");

  const preset = projects.find((p) => p.value === projectId);
  const effectiveCompany = companyId || preset?.companyId || "";
  const companyProjects = projects.filter((p) => p.companyId === effectiveCompany);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>A numbered draft is created — add items on the next screen.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createInvoice({ companyId: effectiveCompany, projectId: projectId || null, currency }), {
              success: "Draft invoice created",
              onSuccess: (d) => {
                onOpenChange(false);
                router.push(`/finance/invoices/${d.id}`);
              },
            });
          }}
        >
          <Field label="Client">
            <Combobox
              value={effectiveCompany}
              onChange={(v) => {
                setCompanyId(v);
                setProjectId("");
              }}
              options={companies.map((c) => ({ value: c.value, label: c.label }))}
              placeholder={loading ? "Loading…" : "Pick a client"}
              allowClear={false}
            />
          </Field>
          {companyProjects.length ? (
            <Field label="Project (optional)">
              <SelectField
                value={projectId}
                onChange={(v) => {
                  setProjectId(v);
                  const p = projects.find((x) => x.value === v);
                  if (p) setCurrency(p.currency);
                }}
                options={companyProjects.map((p) => ({ value: p.value, label: p.label }))}
                allowEmpty
                emptyLabel="No project"
                placeholder="No project"
              />
            </Field>
          ) : null}
          <Field label="Currency">
            <SelectField value={currency} onChange={(v) => setCurrency(v || "EUR")} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !effectiveCompany}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Create draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
