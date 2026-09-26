"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownAZ,
  Building2,
  Filter,
  KanbanSquare,
  LayoutList,
  Plus,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";

import { PriorityBadge, StatusBadge } from "@/components/badges";
import { CompanyLogo } from "@/components/company-logo";
import { EmptyState } from "@/components/empty-state";
import { Combobox, CountryLabel, SelectField } from "@/components/form";
import { RelTime } from "@/components/rel-time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  COMPANY_TYPE_LABEL,
  COMPANY_TYPES,
  CONFIGURATOR_EXISTS,
  OPPORTUNITIES,
  PRIORITIES,
  type CompanyStatus,
} from "@/lib/constants";
import { countryName, flagEmoji } from "@/lib/countries";
import { endOfToday } from "@/lib/dates";
import type { CompanyRow } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AddCompanyDialog } from "./add-company-dialog";
import { CompaniesBoard } from "./companies-board";
import { ConfiguratorCell, FollowUpCell, OpportunityChips } from "./company-cells";
import { VIEWS, type ViewKey } from "./views";



const TALKS: CompanyStatus[] = ["replied", "interested", "proposal"];

function inView(c: CompanyRow, view: ViewKey, dueBefore: number) {
  switch (view) {
    case "all":
      return true;
    case "priority":
      return c.priority === "A" && !["lost", "not_fit"].includes(c.status);
    case "ready":
      return c.status === "ready";
    case "contacted":
      return c.status === "contacted";
    case "talks":
      return TALKS.includes(c.status);
    case "followups":
      return Boolean(c.followUpAt && new Date(c.followUpAt).getTime() <= dueBefore);
    case "clients":
      return c.status === "won";
    case "closed":
      return c.status === "lost" || c.status === "not_fit";
  }
}

type SortKey = "name" | "lastContacted" | "followUp" | "added" | "priority";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name A–Z" },
  { value: "followUp", label: "Next follow-up" },
  { value: "lastContacted", label: "Last contacted" },
  { value: "added", label: "Recently added" },
  { value: "priority", label: "Priority" },
];

const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

type Filters = { country: string; type: string; priority: string; configurator: string; opportunity: string };
const NO_FILTERS: Filters = { country: "", type: "", priority: "", configurator: "", opportunity: "" };

function haystack(c: CompanyRow) {
  return [
    c.name,
    c.domain,
    c.city,
    countryName(c.country),
    c.tags.join(" "),
    ...c.contacts.flatMap((p) => [p.name, p.email, p.role]),
  ]
    .join(" ")
    .toLowerCase();
}

export function CompaniesView({ rows, initialView = "all" }: { rows: CompanyRow[]; initialView?: ViewKey }) {
  const router = useRouter();
  const [view, setView] = useState<ViewKey>(initialView);
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("name");
  const [layout, setLayout] = useState<"table" | "board">("table");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [addKey, setAddKey] = useState(0);

  const dueBefore = useMemo(() => endOfToday().getTime(), []);
  const hay = useMemo(() => new Map(rows.map((r) => [r._id, haystack(r)])), [rows]);

  const counts = useMemo(() => {
    const out = {} as Record<ViewKey, number>;
    for (const v of VIEWS) out[v.key] = rows.filter((r) => inView(r, v.key, dueBefore)).length;
    return out;
  }, [rows, dueBefore]);

  const activeFilters = Object.entries(filters).filter(([, v]) => v) as [keyof Filters, string][];

  // Everything except the letter filter (so the A–Z bar can show counts).
  const base = useMemo(() => {
    const text = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!inView(r, view, dueBefore)) return false;
      if (text && !hay.get(r._id)!.includes(text)) return false;
      if (filters.country && r.country !== filters.country) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.priority && r.priority !== filters.priority) return false;
      if (filters.configurator && (r.configurator?.exists ?? "unknown") !== filters.configurator) return false;
      if (filters.opportunity && !r.opportunities.includes(filters.opportunity)) return false;
      return true;
    });
  }, [rows, view, q, filters, hay, dueBefore]);

  const letterCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of base) m[r.letter] = (m[r.letter] ?? 0) + 1;
    return m;
  }, [base]);

  const visible = useMemo(() => {
    const list = letter ? base.filter((r) => r.letter === letter) : [...base];
    const time = (d: string | null, fallback: number) => (d ? new Date(d).getTime() : fallback);
    switch (sort) {
      case "lastContacted":
        list.sort((a, b) => time(b.lastContactedAt, 0) - time(a.lastContactedAt, 0));
        break;
      case "followUp":
        list.sort((a, b) => time(a.followUpAt, Infinity) - time(b.followUpAt, Infinity));
        break;
      case "added":
        list.sort((a, b) => time(b.createdAt, 0) - time(a.createdAt, 0));
        break;
      case "priority":
        list.sort((a, b) => (a.priority || "Z").localeCompare(b.priority || "Z") || a.name.localeCompare(b.name));
        break;
      default:
        list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    }
    return list;
  }, [base, letter, sort]);

  const grouped = sort === "name";
  const countryOptions = useMemo(() => {
    const codes = Array.from(new Set(rows.map((r) => r.country).filter(Boolean)));
    return codes.map((c) => ({ value: c, label: `${flagEmoji(c)} ${countryName(c)}` })).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const openAdd = () => {
    setAddKey((k) => k + 1);
    setAddOpen(true);
  };

  if (rows.length === 0) {
    return (
      <>
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add the racking companies you find. Each one gets its people, outreach history and follow-ups in one place."
          action={
            <Button onClick={openAdd}>
              <Plus /> Add your first company
            </Button>
          }
        />
        <AddCompanyDialog key={addKey} open={addOpen} onOpenChange={setAddOpen} />
      </>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Views */}
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-thin sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => {
                setView(v.key);
                setLetter("");
              }}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                view === v.key
                  ? "border-transparent bg-brand text-white shadow-brand"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {v.key === "priority" ? <Star className="size-3.5" /> : null}
              {v.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  view === v.key ? "bg-white/25" : "bg-muted",
                  v.key === "followups" && counts.followups > 0 && view !== v.key && "bg-destructive/15 text-destructive",
                )}
              >
                {counts[v.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, website, person, email, city, tag…"
            className="h-10 pl-9"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10">
                <Filter /> Filters
                {activeFilters.length ? (
                  <span className="rounded-full bg-brand px-1.5 text-[11px] text-white">{activeFilters.length}</span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="grid w-80 gap-3">
              <div className="grid gap-1.5">
                <Label>Country</Label>
                <Combobox
                  value={filters.country}
                  onChange={(v) => setFilters((f) => ({ ...f, country: v }))}
                  options={countryOptions}
                  placeholder="Any country"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Type</Label>
                  <SelectField
                    value={filters.type}
                    onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
                    options={COMPANY_TYPES}
                    allowEmpty
                    emptyLabel="Any"
                    placeholder="Any"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Priority</Label>
                  <SelectField
                    value={filters.priority}
                    onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
                    options={PRIORITIES}
                    allowEmpty
                    emptyLabel="Any"
                    placeholder="Any"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Configurator</Label>
                <SelectField
                  value={filters.configurator}
                  onChange={(v) => setFilters((f) => ({ ...f, configurator: v }))}
                  options={CONFIGURATOR_EXISTS}
                  allowEmpty
                  emptyLabel="Any"
                  placeholder="Any"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Opportunity</Label>
                <SelectField
                  value={filters.opportunity}
                  onChange={(v) => setFilters((f) => ({ ...f, opportunity: v }))}
                  options={OPPORTUNITIES.map((o) => ({ value: o, label: o }))}
                  allowEmpty
                  emptyLabel="Any"
                  placeholder="Any"
                />
              </div>
              {activeFilters.length ? (
                <Button variant="ghost" size="sm" onClick={() => setFilters(NO_FILTERS)}>
                  Clear filters
                </Button>
              ) : null}
            </PopoverContent>
          </Popover>
          <SelectField
            value={sort}
            onChange={(v) => setSort((v || "name") as SortKey)}
            options={SORTS}
            className="h-10 w-[150px]"
          />
          <div className="hidden h-10 items-center rounded-lg border bg-card p-1 sm:flex">
            <button
              type="button"
              onClick={() => setLayout("table")}
              className={cn(
                "grid h-8 w-9 place-items-center rounded-md text-muted-foreground",
                layout === "table" && "bg-accent text-accent-foreground",
              )}
              aria-label="Table view"
            >
              <LayoutList className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("board")}
              className={cn(
                "grid h-8 w-9 place-items-center rounded-md text-muted-foreground",
                layout === "board" && "bg-accent text-accent-foreground",
              )}
              aria-label="Board view"
            >
              <KanbanSquare className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {activeFilters.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, [k]: "" }))}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
            >
              {k === "country"
                ? `${flagEmoji(v)} ${countryName(v)}`
                : k === "type"
                  ? COMPANY_TYPE_LABEL[v as keyof typeof COMPANY_TYPE_LABEL]
                  : k === "configurator"
                    ? CONFIGURATOR_EXISTS.find((c) => c.value === v)?.label
                    : k === "priority"
                      ? `Priority ${v}`
                      : v}
              <X className="size-3" />
            </button>
          ))}
        </div>
      ) : null}

      {/* A–Z */}
      {layout === "table" ? (
        <div className="-mx-4 overflow-x-auto px-4 scrollbar-thin sm:mx-0 sm:px-0">
          <div className="flex w-max items-center gap-0.5 rounded-xl border bg-card p-1">
            <button
              type="button"
              onClick={() => setLetter("")}
              className={cn(
                "h-7 rounded-md px-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent",
                !letter && "bg-brand text-white hover:bg-brand",
              )}
            >
              All
            </button>
            {LETTERS.map((l) => {
              const n = letterCounts[l] ?? 0;
              return (
                <button
                  key={l}
                  type="button"
                  disabled={n === 0}
                  onClick={() => setLetter(letter === l ? "" : l)}
                  title={`${n} ${n === 1 ? "company" : "companies"}`}
                  className={cn(
                    "h-7 w-7 rounded-md text-xs font-semibold transition-colors",
                    n === 0 ? "text-muted-foreground/30" : "text-foreground/80 hover:bg-accent",
                    letter === l && "bg-brand text-white hover:bg-brand",
                  )}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <b className="text-foreground">{visible.length}</b> of {rows.length} companies
          {letter ? ` · letter ${letter}` : ""}
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <ArrowDownAZ className="size-3.5" /> {SORTS.find((s) => s.value === sort)?.label}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title={q ? `No company matches “${q}”` : "Nothing in this view"}
          description={q ? "It’s not in your list yet — add it now so you never research it twice." : undefined}
          action={
            q ? (
              <Button onClick={openAdd}>
                <Plus /> Add “{q}”
              </Button>
            ) : undefined
          }
        />
      ) : layout === "board" ? (
        <CompaniesBoard rows={visible} />
      ) : (
        <>
          <CompaniesTable rows={visible} grouped={grouped} onOpen={(id) => router.push(`/marketing/companies/${id}`)} />
          <CompaniesCards rows={visible} grouped={grouped} />
        </>
      )}

      <AddCompanyDialog key={addKey} open={addOpen} onOpenChange={setAddOpen} initialName={q.trim()} />
    </div>
  );
}

function groupRows(rows: CompanyRow[], grouped: boolean) {
  if (!grouped) return [{ letter: "", rows }];
  const out: { letter: string; rows: CompanyRow[] }[] = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.letter === r.letter) last.rows.push(r);
    else out.push({ letter: r.letter, rows: [r] });
  }
  return out;
}

function PeopleCell({ c }: { c: CompanyRow }) {
  if (!c.contacts.length) return <span className="text-muted-foreground/60">—</span>;
  const primary = c.contacts.find((p) => p.decisionMaker) ?? c.contacts[0];
  return (
    <span className="flex items-center gap-1.5">
      <Users className="size-3.5 text-muted-foreground" />
      <span className="max-w-[140px] truncate">{primary.name}</span>
      {c.contacts.length > 1 ? <span className="text-xs text-muted-foreground">+{c.contacts.length - 1}</span> : null}
    </span>
  );
}

function CompaniesTable({
  rows,
  grouped,
  onOpen,
}: {
  rows: CompanyRow[];
  grouped: boolean;
  onOpen: (id: string) => void;
}) {
  const groups = groupRows(rows, grouped);
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-2.5">Company</th>
              <th className="px-3 py-2.5">Country</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5 text-center">Prio</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Configurator</th>
              <th className="px-3 py-2.5">Opportunity</th>
              <th className="px-3 py-2.5">People</th>
              <th className="px-3 py-2.5">Last contact</th>
              <th className="px-3 py-2.5">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.letter || "all"} letter={g.letter} rows={g.rows} onOpen={onOpen} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRows({ letter, rows, onOpen }: { letter: string; rows: CompanyRow[]; onOpen: (id: string) => void }) {
  return (
    <>
      {letter ? (
        <tr className="border-b bg-muted/25">
          <td colSpan={10} className="px-4 py-1.5">
            <span className="inline-grid size-6 place-items-center rounded-md bg-brand text-xs font-bold text-white">
              {letter}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">{rows.length}</span>
          </td>
        </tr>
      ) : null}
      {rows.map((c) => (
        <tr
          key={c._id}
          onClick={() => onOpen(c._id)}
          className="cursor-pointer border-b transition-colors last:border-0 hover:bg-accent/40"
        >
          <td className="px-4 py-2.5">
            <div className="flex items-center gap-3">
              <CompanyLogo name={c.name} domain={c.domain} />
              <div className="min-w-0">
                <Link
                  href={`/marketing/companies/${c._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block max-w-[220px] truncate font-medium hover:text-primary"
                >
                  {c.name}
                </Link>
                {c.domain ? (
                  <a
                    href={`https://${c.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block max-w-[220px] truncate text-xs text-muted-foreground hover:text-primary"
                  >
                    {c.domain}
                  </a>
                ) : null}
              </div>
            </div>
          </td>
          <td className="px-3 py-2.5 whitespace-nowrap">
            <CountryLabel code={c.country} />
          </td>
          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
            {c.type ? COMPANY_TYPE_LABEL[c.type] : "—"}
          </td>
          <td className="px-3 py-2.5 text-center">
            <PriorityBadge priority={c.priority} />
          </td>
          <td className="px-3 py-2.5">
            <StatusBadge status={c.status} />
          </td>
          <td className="px-3 py-2.5">
            <ConfiguratorCell c={c} />
          </td>
          <td className="px-3 py-2.5">
            <OpportunityChips items={c.opportunities} />
          </td>
          <td className="px-3 py-2.5 whitespace-nowrap">
            <PeopleCell c={c} />
          </td>
          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
            <RelTime date={c.lastContactedAt} />
          </td>
          <td className="px-3 py-2.5 whitespace-nowrap">
            <FollowUpCell date={c.followUpAt} />
          </td>
        </tr>
      ))}
    </>
  );
}

function CompaniesCards({ rows, grouped }: { rows: CompanyRow[]; grouped: boolean }) {
  const groups = groupRows(rows, grouped);
  return (
    <div className="grid gap-4 md:hidden">
      {groups.map((g) => (
        <div key={g.letter || "all"} className="grid gap-2">
          {g.letter ? (
            <div className="flex items-center gap-2 px-1">
              <span className="inline-grid size-6 place-items-center rounded-md bg-brand text-xs font-bold text-white">
                {g.letter}
              </span>
              <span className="text-xs text-muted-foreground">{g.rows.length}</span>
            </div>
          ) : null}
          {g.rows.map((c) => (
            <Link
              key={c._id}
              href={`/marketing/companies/${c._id}`}
              className="grid gap-2 rounded-xl border bg-card p-3 transition-colors active:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <CompanyLogo name={c.name} domain={c.domain} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[c.domain, c.country ? `${flagEmoji(c.country)} ${countryName(c.country)}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <PriorityBadge priority={c.priority} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={c.status} />
                <ConfiguratorCell c={c} />
                {c.contacts.length ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Users className="size-3" /> {c.contacts.length}
                  </span>
                ) : null}
                <span className="ml-auto">
                  <FollowUpCell date={c.followUpAt} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
