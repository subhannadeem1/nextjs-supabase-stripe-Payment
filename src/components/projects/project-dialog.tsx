"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Repeat, Rocket } from "lucide-react";

import { listCompanyOptions } from "@/actions/companies";
import { createProject, updateProject } from "@/actions/projects";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CURRENCIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  type BillingType,
  type Currency,
  type ProjectStatus,
} from "@/lib/constants";
import { toInputDate, todayInput } from "@/lib/dates";
import type { ProjectDTO } from "@/lib/types";
import { useOptions } from "@/lib/use-options";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

export function ProjectDialog({
  open,
  onOpenChange,
  presetCompanyId,
  defaultCurrency,
  project,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetCompanyId?: string;
  defaultCurrency: string;
  project?: ProjectDTO;
}) {
  const router = useRouter();
  const { pending, run } = useRunAction();
  const { options: companies, loading } = useOptions(listCompanyOptions, open && !project);
  const [form, setForm] = useState({
    companyId: project?.companyId ?? presetCompanyId ?? "",
    title: project?.title ?? "",
    type: project?.type ?? "",
    billing: (project?.billing ?? "one_time") as BillingType,
    status: (project?.status ?? "planning") as ProjectStatus,
    currency: (project?.currency ?? defaultCurrency ?? "EUR") as Currency,
    value: project ? String(project.value || "") : "",
    monthlyAmount: project ? String(project.monthlyAmount || "") : "",
    billingDay: String(project?.billingDay ?? 1),
    startDate: project ? toInputDate(project.startDate) : todayInput(),
    dueDate: project ? toInputDate(project.dueDate) : "",
    endDate: project ? toInputDate(project.endDate) : "",
    description: project?.description ?? "",
    scope: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Suggest a title from the type + client until you write your own.
  const [titleTouched, setTitleTouched] = useState(Boolean(project));
  const suggest = (type: string, companyId: string) => {
    if (titleTouched) return;
    const label = companies.find((c) => c.value === companyId)?.label;
    if (type) set("title", label ? `${type} for ${label}` : type);
  };

  const submit = () => {
    const payload = {
      companyId: form.companyId,
      title: form.title,
      type: form.type,
      billing: form.billing,
      status: form.status,
      currency: form.currency,
      value: Number(form.value || 0),
      monthlyAmount: Number(form.monthlyAmount || 0),
      billingDay: Number(form.billingDay || 1),
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      endDate: form.endDate || null,
      description: form.description,
    };
    if (project) {
      run(() => updateProject(project._id, payload), { success: "Project saved", onSuccess: () => onOpenChange(false) });
    } else {
      run(() => createProject({ ...payload, scope: form.scope.split("\n") }), {
        success: "Project created 🎉",
        onSuccess: (d) => {
          onOpenChange(false);
          router.push(`/projects/${d.id}`);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {project ? project.company?.name : "Starting a project marks the client as Won automatically."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {!project ? (
            <Field label="Client">
              <Combobox
                value={form.companyId}
                onChange={(v) => {
                  set("companyId", v);
                  suggest(form.type, v);
                }}
                options={companies.map((c) => ({ value: c.value, label: c.label, keywords: [c.domain] }))}
                placeholder={loading ? "Loading…" : "Pick a company"}
                searchPlaceholder="Search companies…"
                allowClear={false}
              />
            </Field>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <SelectField
                value={form.type}
                onChange={(v) => {
                  set("type", v);
                  suggest(v, form.companyId);
                }}
                options={PROJECT_TYPES.map((t) => ({ value: t, label: t }))}
                allowEmpty
                emptyLabel="Not set"
                placeholder="What are you building?"
              />
            </Field>
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => {
                  setTitleTouched(true);
                  set("title", e.target.value);
                }}
                required
                placeholder="e.g. 3D Configurator for SUN-AGE"
              />
            </Field>
          </div>

          <Field label="Billing">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { v: "one_time", label: "One-time build", hint: "Fixed price, milestones", icon: Rocket },
                  { v: "monthly", label: "Monthly service", hint: "Recurring every month", icon: Repeat },
                ] as const
              ).map((b) => (
                <button
                  key={b.v}
                  type="button"
                  onClick={() => set("billing", b.v)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    form.billing === b.v ? "border-primary/60 bg-accent" : "hover:bg-accent/40",
                  )}
                >
                  <b.icon className={cn("mt-0.5 size-4", form.billing === b.v ? "text-primary" : "text-muted-foreground")} />
                  <span>
                    <span className="block text-sm font-medium">{b.label}</span>
                    <span className="block text-xs text-muted-foreground">{b.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Currency">
              <SelectField
                value={form.currency}
                onChange={(v) => set("currency", (v || "EUR") as Currency)}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </Field>
            {form.billing === "one_time" ? (
              <Field label="Contract value" className="sm:col-span-2">
                <Input type="number" inputMode="decimal" min={0} step="0.01" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0" />
              </Field>
            ) : (
              <>
                <Field label="Monthly amount">
                  <Input type="number" inputMode="decimal" min={0} step="0.01" value={form.monthlyAmount} onChange={(e) => set("monthlyAmount", e.target.value)} placeholder="0" />
                </Field>
                <Field label="Billing day">
                  <Input type="number" min={1} max={28} value={form.billingDay} onChange={(e) => set("billingDay", e.target.value)} />
                </Field>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            {form.billing === "one_time" ? (
              <Field label="Deadline">
                <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
              </Field>
            ) : (
              <Field label="End date (optional)">
                <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </Field>
            )}
            <Field label="Status">
              <SelectField value={form.status} onChange={(v) => set("status", (v || "planning") as ProjectStatus)} options={PROJECT_STATUSES} />
            </Field>
          </div>

          <Field label="Short description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="What’s the goal?" />
          </Field>
          {!project ? (
            <Field label="Scope — one deliverable per line (optional)">
              <Textarea
                value={form.scope}
                onChange={(e) => set("scope", e.target.value)}
                rows={4}
                placeholder={"3D roof builder\nPanel layout + BOM export\nPDF quote\nAdmin panel for prices"}
              />
            </Field>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.companyId || !form.title.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {project ? "Save" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
