"use client";

import { useMemo, useState } from "react";
import { Briefcase, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SelectField } from "@/components/form";
import { useQuickActions } from "@/components/shell/quick-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACTIVE_PROJECT_STATUSES, BILLING_TYPES } from "@/lib/constants";
import type { ProjectDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ProjectCard } from "./project-card";

const TABS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export function ProjectsView({ projects }: { projects: ProjectDTO[] }) {
  const quick = useQuickActions();
  const [tab, setTab] = useState<Tab>("active");
  const [billing, setBilling] = useState("");
  const [q, setQ] = useState("");

  const inTab = (p: ProjectDTO, t: Tab) =>
    t === "all" ? true : t === "active" ? ACTIVE_PROJECT_STATUSES.includes(p.status) : p.status === t;

  const visible = useMemo(() => {
    const text = q.trim().toLowerCase();
    return projects.filter(
      (p) =>
        inTab(p, tab) &&
        (!billing || p.billing === billing) &&
        (!text || `${p.title} ${p.company?.name ?? ""} ${p.type}`.toLowerCase().includes(text)),
    );
  }, [projects, tab, billing, q]);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No projects yet"
        description="When a company says yes, start a project: scope, deadline, milestones and payments all live here."
        action={
          <Button onClick={() => quick.open("project")}>
            <Plus /> New project
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium",
                tab === t.key ? "border-transparent bg-brand text-white shadow-brand" : "bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-[11px]", tab === t.key ? "bg-white/25" : "bg-muted")}>
                {projects.filter((p) => inTab(p, t.key)).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 gap-2 sm:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="pl-9" />
          </div>
          <SelectField
            value={billing}
            onChange={setBilling}
            options={BILLING_TYPES}
            allowEmpty
            emptyLabel="All billing"
            placeholder="All billing"
            className="w-[160px]"
          />
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No projects here.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p._id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
