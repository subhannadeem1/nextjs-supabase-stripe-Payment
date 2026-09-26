"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { updateCompany } from "@/actions/companies";
import { ChipsSelect, CountrySelect, Field, SelectField, TagsInput } from "@/components/form";
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
  COMPANY_TYPES,
  CONFIGURATOR_EXISTS,
  CONFIGURATOR_KINDS,
  OPPORTUNITIES,
  PRIORITIES,
  SEGMENTS,
  type CompanyType,
  type ConfiguratorExists,
  type Priority,
} from "@/lib/constants";
import type { CompanyDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";

export function EditCompanyDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  company: CompanyDTO;
}) {
  const { pending, run } = useRunAction();
  const [form, setForm] = useState({
    name: company.name,
    website: company.website,
    country: company.country,
    city: company.city,
    type: company.type as CompanyType | "",
    priority: company.priority as Priority | "",
    segments: company.segments,
    opportunities: company.opportunities,
    source: company.source,
    tags: company.tags,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit company</DialogTitle>
          <DialogDescription>Keep it short — the details page shows everything.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateCompany(company._id, form), { success: "Saved", onSuccess: () => onOpenChange(false) });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Website">
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="company.com" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country">
              <CountrySelect value={form.country} onChange={(v) => set("country", v)} />
            </Field>
            <Field label="City / region">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company type">
              <SelectField
                value={form.type}
                onChange={(v) => set("type", v as CompanyType | "")}
                options={COMPANY_TYPES}
                allowEmpty
                emptyLabel="Not set"
                placeholder="Not set"
              />
            </Field>
            <Field label="Priority">
              <SelectField
                value={form.priority}
                onChange={(v) => set("priority", v as Priority | "")}
                options={PRIORITIES}
                allowEmpty
                emptyLabel="Not set"
                placeholder="Not set"
              />
            </Field>
          </div>
          <Field label="Product segments">
            <ChipsSelect options={SEGMENTS} value={form.segments} onChange={(v) => set("segments", v)} />
          </Field>
          <Field label="Opportunity (what you can build)">
            <ChipsSelect options={OPPORTUNITIES} value={form.opportunities} onChange={(v) => set("opportunities", v)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Source">
              <Input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Where you found them" />
            </Field>
            <Field label="Tags">
              <TagsInput value={form.tags} onChange={(v) => set("tags", v)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfiguratorDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  company: CompanyDTO;
}) {
  const { pending, run } = useRunAction();
  const [form, setForm] = useState({
    exists: company.configurator.exists as ConfiguratorExists,
    url: company.configurator.url,
    kind: company.configurator.kind,
    weaknesses: company.configurator.weaknesses,
  });
  const [opps, setOpps] = useState(company.opportunities);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Configurator analysis</DialogTitle>
          <DialogDescription>What they have today, and where it falls short — this becomes your pitch.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateCompany(company._id, { configurator: form, opportunities: opps }), {
              success: "Analysis saved",
              onSuccess: () => onOpenChange(false),
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Do they have one?">
              <SelectField value={form.exists} onChange={(v) => set("exists", (v || "unknown") as ConfiguratorExists)} options={CONFIGURATOR_EXISTS} />
            </Field>
            <Field label="Kind">
              <SelectField
                value={form.kind}
                onChange={(v) => set("kind", v)}
                options={CONFIGURATOR_KINDS.map((k) => ({ value: k, label: k }))}
                allowEmpty
                emptyLabel="Not set"
                placeholder="Not set"
              />
            </Field>
          </div>
          <Field label="Configurator link">
            <Input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Weaknesses you noticed" hint="Used as {{weakness}} in message templates.">
            <Textarea
              value={form.weaknesses}
              onChange={(e) => set("weaknesses", e.target.value)}
              rows={4}
              placeholder="e.g. no 3D preview, slow on mobile, no BOM export, outdated design…"
            />
          </Field>
          <Field label="What you can build for them">
            <ChipsSelect options={OPPORTUNITIES} value={opps} onChange={setOpps} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
