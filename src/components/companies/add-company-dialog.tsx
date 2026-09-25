"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, CircleCheck, ExternalLink, Loader2, Sparkles } from "lucide-react";

import { checkDuplicates, createCompany } from "@/actions/companies";
import { StatusBadge } from "@/components/badges";
import { ChipsSelect, CountrySelect, Field, SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  COMPANY_STATUSES,
  COMPANY_TYPES,
  OPPORTUNITIES,
  PRIORITIES,
  SEGMENTS,
  type CompanyStatus,
  type CompanyType,
  type Priority,
} from "@/lib/constants";
import { relativeDay } from "@/lib/dates";
import { normalizeDomain } from "@/lib/normalize";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

type Dup = Awaited<ReturnType<typeof checkDuplicates>>;
type DupData = Extract<Dup, { ok: true }>["data"];

/** "dome-solar.com" -> "Dome Solar" */
function nameFromDomain(domain: string) {
  const base = domain.split(".")[0] ?? "";
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const EMPTY = {
  website: "",
  name: "",
  country: "",
  city: "",
  status: "researching" as CompanyStatus,
  priority: "" as Priority | "",
  type: "" as CompanyType | "",
  segments: [] as string[],
  opportunities: [] as string[],
  source: "",
};

export function AddCompanyDialog({
  open,
  onOpenChange,
  initialName = "",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName?: string;
}) {
  const router = useRouter();
  const { pending, run } = useRunAction();
  const [form, setForm] = useState({ ...EMPTY, name: initialName });
  const [nameTouched, setNameTouched] = useState(Boolean(initialName));
  const [more, setMore] = useState(false);
  const [force, setForce] = useState(false);
  // Duplicate-check result, tagged with the input it was computed for.
  const [dupState, setDupState] = useState<{ key: string; data: DupData } | null>(null);
  const reqId = useRef(0);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const inputKey = JSON.stringify([form.name.trim(), form.website.trim()]);
  const hasInput = Boolean(form.name.trim() || form.website.trim());
  const dup = hasInput && dupState?.key === inputKey ? dupState.data : null;
  const checking = hasInput && dupState?.key !== inputKey;

  // Live duplicate check while typing (debounced).
  useEffect(() => {
    if (!open || !hasInput) return;
    const id = ++reqId.current;
    const [name, website] = JSON.parse(inputKey) as [string, string];
    const t = setTimeout(async () => {
      const res = await checkDuplicates({ name, website });
      if (id === reqId.current && res.ok) setDupState({ key: inputKey, data: res.data });
    }, 280);
    return () => clearTimeout(t);
  }, [inputKey, hasInput, open]);

  const onWebsite = (v: string) => {
    setForm((f) => {
      const next = { ...f, website: v };
      if (!nameTouched) {
        const d = normalizeDomain(v);
        next.name = d ? nameFromDomain(d) : f.name;
      }
      return next;
    });
  };

  const blocked = Boolean(dup?.domainMatch);
  const needsForce = Boolean(dup?.nameMatches.length) && !force;
  const canSave = form.name.trim().length > 0 && !blocked && !needsForce && !pending;

  const submit = (another: boolean) => {
    run(() => createCompany({ ...form, force }), {
      success: `${form.name.trim()} added`,
      onSuccess: (data) => {
        if (another) {
          setForm({ ...EMPTY, country: form.country, status: form.status });
          setNameTouched(false);
          setForce(false);
        } else {
          onOpenChange(false);
          router.push(`/marketing/companies/${data.id}`);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add company</DialogTitle>
          <DialogDescription>Paste the website first — I’ll check it isn’t already in your list.</DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) submit(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website" htmlFor="ac-website">
              <Input
                id="ac-website"
                placeholder="e.g. sun-age.it"
                value={form.website}
                onChange={(e) => onWebsite(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Company name" htmlFor="ac-name">
              <Input
                id="ac-name"
                placeholder="e.g. SUN-AGE"
                value={form.name}
                onChange={(e) => {
                  setNameTouched(true);
                  set("name", e.target.value);
                }}
                required
              />
            </Field>
          </div>

          <DuplicatePanel dup={dup} checking={checking} force={force} setForce={setForce} onOpen={() => onOpenChange(false)} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Country">
              <CountrySelect value={form.country} onChange={(v) => set("country", v)} />
            </Field>
            <Field label="Status">
              <SelectField
                value={form.status}
                onChange={(v) => set("status", (v || "researching") as CompanyStatus)}
                options={COMPANY_STATUSES}
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

          <button
            type="button"
            onClick={() => setMore((m) => !m)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <ChevronDown className={cn("size-4 transition-transform", more && "rotate-180")} />
            {more ? "Fewer details" : "More details (type, products, opportunity)"}
          </button>

          {more ? (
            <div className="grid gap-4 rounded-xl border bg-muted/30 p-4">
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
                <Field label="City">
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Vicenza" />
                </Field>
              </div>
              <Field label="Product segments">
                <ChipsSelect options={SEGMENTS} value={form.segments} onChange={(v) => set("segments", v)} />
              </Field>
              <Field label="What can you build for them?">
                <ChipsSelect options={OPPORTUNITIES} value={form.opportunities} onChange={(v) => set("opportunities", v)} />
              </Field>
              <Field label="Where did you find them?">
                <Input
                  value={form.source}
                  onChange={(e) => set("source", e.target.value)}
                  placeholder="e.g. Intersolar exhibitor list, Google, LinkedIn"
                />
              </Field>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={!canSave} onClick={() => submit(true)}>
              Save & add another
            </Button>
            <Button type="submit" disabled={!canSave}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save & open
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DuplicatePanel({
  dup,
  checking,
  force,
  setForce,
  onOpen,
}: {
  dup: DupData | null;
  checking: boolean;
  force: boolean;
  setForce: (v: boolean) => void;
  onOpen: () => void;
}) {
  if (!dup) {
    return checking ? (
      <p className="-mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Checking your list…
      </p>
    ) : null;
  }
  const { domainMatch, nameMatches, similar } = dup;
  if (!domainMatch && !nameMatches.length && !similar.length) {
    return checking ? null : (
      <p className="-mt-1 flex items-center gap-1.5 text-xs text-success">
        <CircleCheck className="size-3.5" /> New company — not in your list yet.
      </p>
    );
  }
  const row = (c: NonNullable<DupData["domainMatch"]>) => (
    <Link
      key={c._id}
      href={`/marketing/companies/${c._id}`}
      onClick={onOpen}
      className="flex items-center gap-2 rounded-lg bg-card/80 px-3 py-2 text-sm transition-colors hover:bg-card"
    >
      <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
      <StatusBadge status={c.status} />
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {c.lastContactedAt ? `contacted ${relativeDay(c.lastContactedAt)}` : "not contacted"}
      </span>
      <ExternalLink className="size-3.5 text-muted-foreground" />
    </Link>
  );
  return (
    <div className="-mt-1 grid gap-2">
      {domainMatch ? (
        <div className="grid gap-2 rounded-xl border border-destructive/30 bg-destructive/8 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="size-4" /> Already in your list — same website
          </p>
          {row(domainMatch)}
        </div>
      ) : null}
      {nameMatches.length ? (
        <div className="grid gap-2 rounded-xl border border-warning/30 bg-warning/8 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="size-4" /> A company with this name exists
          </p>
          {nameMatches.map(row)}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={force} onCheckedChange={(v) => setForce(v === true)} />
            It’s a different company — add anyway
          </label>
        </div>
      ) : null}
      {!domainMatch && !nameMatches.length && similar.length ? (
        <div className="grid gap-1.5 rounded-xl border bg-muted/40 p-3">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" /> Similar names in your list
          </p>
          {similar.map(row)}
        </div>
      ) : null}
    </div>
  );
}
