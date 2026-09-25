"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  ArrowLeft,
  Briefcase,
  CalendarPlus,
  Check,
  CheckSquare,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Plus,
  ScanSearch,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteCompany,
  setCompanyStatus,
  setFollowUp,
  setResearchStep,
  snoozeFollowUp,
  updateCompany,
  updateCompanyNotes,
} from "@/actions/companies";
import { toggleTask } from "@/actions/tasks";
import { PriorityBadge, ProjectStatusBadge, StatusBadge } from "@/components/badges";
import { CompanyLogo } from "@/components/company-logo";
import { ConfirmDialog } from "@/components/confirm";
import { CountryLabel } from "@/components/form";
import { useQuickActions } from "@/components/shell/quick-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  BILLING_LABEL,
  COMPANY_STATUSES,
  COMPANY_TYPE_LABEL,
  PRIORITIES,
  RESEARCH_STEPS,
  type CompanyStatus,
  type Priority,
} from "@/lib/constants";
import { daysFromToday, fmtDate, inputDatePlus, relativeDay, toInputDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { toUrl } from "@/lib/normalize";
import type {
  ActivityDTO,
  CompanyDTO,
  ContactDTO,
  DemoDTO,
  ProjectDTO,
  SettingsDTO,
  TaskDTO,
  TemplateDTO,
} from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

import { ContactDialog } from "./contact-dialog";
import { ConfiguratorCell } from "./company-cells";
import { PeopleCard } from "./company-people";
import { TimelineCard } from "./company-timeline";
import { ConfiguratorDialog, EditCompanyDialog } from "./edit-company-dialog";
import { LogActivityDialog, type LogPreset } from "./log-activity-dialog";
import { UseTemplateDialog } from "./use-template-dialog";

export type CompanyDetailData = {
  company: CompanyDTO;
  activities: ActivityDTO[];
  projects: ProjectDTO[];
  tasks: TaskDTO[];
  templates: TemplateDTO[];
  demos: DemoDTO[];
};

export function CompanyDetail({ data, settings }: { data: CompanyDetailData; settings: SettingsDTO }) {
  const { company, activities, projects, tasks, templates, demos } = data;
  const quick = useQuickActions();

  const [log, setLog] = useState<{ open: boolean; key: number; preset?: LogPreset }>({ open: false, key: 0 });
  const [person, setPerson] = useState<{ open: boolean; key: number; contact?: ContactDTO | null }>({ open: false, key: 0 });
  const [tpl, setTpl] = useState<{ open: boolean; key: number; contactId?: string }>({ open: false, key: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [cfgOpen, setCfgOpen] = useState(false);

  const openLog = (preset?: LogPreset) => setLog((s) => ({ open: true, key: s.key + 1, preset }));
  const openPerson = (contact?: ContactDTO | null) => setPerson((s) => ({ open: true, key: s.key + 1, contact }));
  const openTemplate = (contactId?: string) => setTpl((s) => ({ open: true, key: s.key + 1, contactId }));

  return (
    <div className="grid gap-5">
      <CompanyHeader
        company={company}
        onLog={() => openLog()}
        onTemplate={() => openTemplate()}
        onAddPerson={() => openPerson(null)}
        onEdit={() => setEditOpen(true)}
        onProject={() => quick.open("project", { companyId: company._id })}
        onTask={() => quick.open("task", { companyId: company._id })}
        onInvoice={() => quick.open("invoice", { companyId: company._id })}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <ConfiguratorCard company={company} onEdit={() => setCfgOpen(true)} />
          <PeopleCard
            companyId={company._id}
            contacts={company.contacts}
            activities={activities}
            onAdd={() => openPerson(null)}
            onEdit={(c) => openPerson(c)}
            onLog={(contactId) => openLog({ contactId })}
            onTemplate={(contactId) => openTemplate(contactId)}
          />
          <TimelineCard
            activities={activities}
            contacts={company.contacts}
            onLog={() => openLog()}
            onNote={() => openLog({ kind: "note" })}
          />
        </div>
        <div className="grid min-w-0 gap-5">
          <FollowUpCard company={company} defaultDays={settings.followUpDays} />
          <ResearchCard company={company} />
          <DetailsCard company={company} onEdit={() => setEditOpen(true)} />
          <ProjectsCard projects={projects} onNew={() => quick.open("project", { companyId: company._id })} />
          <TasksCard tasks={tasks} onNew={() => quick.open("task", { companyId: company._id })} />
          <NotesCard company={company} />
        </div>
      </div>

      <LogActivityDialog
        key={`log${log.key}`}
        open={log.open}
        onOpenChange={(o) => setLog((s) => ({ ...s, open: o }))}
        companyId={company._id}
        companyName={company.name}
        contacts={company.contacts}
        activities={activities}
        demos={demos}
        defaultFollowUpDays={settings.followUpDays}
        preset={log.preset}
      />
      <ContactDialog
        key={`p${person.key}`}
        open={person.open}
        onOpenChange={(o) => setPerson((s) => ({ ...s, open: o }))}
        companyId={company._id}
        contact={person.contact}
      />
      <UseTemplateDialog
        key={`t${tpl.key}`}
        open={tpl.open}
        onOpenChange={(o) => setTpl((s) => ({ ...s, open: o }))}
        company={company}
        templates={templates}
        me={{ ownerName: settings.ownerName, businessName: settings.businessName }}
        presetContactId={tpl.contactId}
        followUpDays={settings.followUpDays}
      />
      {editOpen ? <EditCompanyDialog open onOpenChange={setEditOpen} company={company} /> : null}
      {cfgOpen ? <ConfiguratorDialog open onOpenChange={setCfgOpen} company={company} /> : null}
    </div>
  );
}

/* --------------------------------- Header --------------------------------- */

function CompanyHeader({
  company,
  onLog,
  onTemplate,
  onAddPerson,
  onEdit,
  onProject,
  onTask,
  onInvoice,
}: {
  company: CompanyDTO;
  onLog: () => void;
  onTemplate: () => void;
  onAddPerson: () => void;
  onEdit: () => void;
  onProject: () => void;
  onTask: () => void;
  onInvoice: () => void;
}) {
  const router = useRouter();
  const { run } = useRunAction();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <CompanyLogo name={company.name} domain={company.domain} className="size-14 rounded-2xl text-base" />
          <div className="min-w-0">
            <Link
              href="/marketing/companies"
              className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3" /> Client hunting
            </Link>
            <h1 className="truncate text-2xl font-semibold tracking-tight">{company.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {company.domain || company.website ? (
                <a
                  href={toUrl(company.website || company.domain)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  {company.domain || company.website} <ExternalLink className="size-3" />
                </a>
              ) : null}
              {company.country || company.city ? <CountryLabel code={company.country} city={company.city} /> : null}
              {company.type ? <span>{COMPANY_TYPE_LABEL[company.type]}</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusControl company={company} />
              <PriorityControl company={company} />
              {company.lastContactedAt ? (
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  Last contact {relativeDay(company.lastContactedAt)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Never contacted</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onLog}>
            <Send /> Log outreach
          </Button>
          <Button variant="outline" onClick={onTemplate}>
            <MessageSquareText /> Use template
          </Button>
          <Button variant="outline" onClick={onAddPerson} className="hidden sm:inline-flex">
            <UserPlus /> Person
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil /> Edit details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddPerson}>
                <UserPlus /> Add person
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onProject}>
                <Briefcase /> New project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTask}>
                <CheckSquare /> New task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onInvoice}>
                <FileText /> New invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> Delete company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${company.name}?`}
        description="Removes the company, its people, outreach history and tasks. This can’t be undone."
        onConfirm={() =>
          run(() => deleteCompany(company._id), {
            success: "Company deleted",
            onSuccess: () => router.push("/marketing/companies"),
          })
        }
      />
    </div>
  );
}

function StatusControl({ company }: { company: CompanyDTO }) {
  const { pending, run } = useRunAction();
  const [ask, setAsk] = useState<CompanyStatus | null>(null);
  const [reason, setReason] = useState("");
  const change = (s: CompanyStatus) => {
    if (s === company.status) return;
    if (s === "lost" || s === "not_fit") {
      setReason("");
      setAsk(s);
      return;
    }
    run(() => setCompanyStatus(company._id, s), { success: "Status updated" });
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40" disabled={pending}>
          <StatusBadge status={company.status} className="cursor-pointer py-1 pr-2.5 text-[13px] hover:opacity-85" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {COMPANY_STATUSES.map((s) => (
            <DropdownMenuItem key={s.value} onClick={() => change(s.value)} className="flex-col items-start gap-0">
              <span className="flex w-full items-center gap-2">
                <StatusBadge status={s.value} />
                {company.status === s.value ? <Check className="ml-auto size-4" /> : null}
              </span>
              <span className="pl-1 text-[11px] text-muted-foreground">{s.hint}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={Boolean(ask)} onOpenChange={(o) => !o && setAsk(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ask === "lost" ? "Mark as lost" : "Mark as not a fit"}</DialogTitle>
            <DialogDescription>Write why, so future-you knows not to research them again.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={ask === "lost" ? "e.g. went with another vendor, no budget" : "e.g. already has a great 3D configurator"}
            rows={3}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsk(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                ask &&
                run(() => setCompanyStatus(company._id, ask, reason), {
                  success: "Status updated",
                  onSuccess: () => setAsk(null),
                })
              }
              disabled={pending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PriorityControl({ company }: { company: CompanyDTO }) {
  const { run } = useRunAction();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs text-muted-foreground outline-none hover:bg-accent">
        Priority <PriorityBadge priority={company.priority} className="size-5 text-[10px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {PRIORITIES.map((p) => (
          <DropdownMenuItem
            key={p.value}
            onClick={() => run(() => updateCompany(company._id, { priority: p.value as Priority }), { success: "Priority updated" })}
          >
            <PriorityBadge priority={p.value} className="size-5 text-[10px]" /> {p.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => run(() => updateCompany(company._id, { priority: "" }))}>Clear</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------------------------- Cards ---------------------------------- */

function ConfiguratorCard({ company, onEdit }: { company: CompanyDTO; onEdit: () => void }) {
  const c = company.configurator;
  const empty = c.exists === "unknown" && !c.weaknesses && !company.opportunities.length;
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>
          <ScanSearch className="size-4 text-primary" /> Configurator analysis
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil /> Edit
        </Button>
      </CardHeader>
      <CardContent>
        {empty ? (
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-xl border border-dashed p-5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/40"
          >
            Check their website: do they have a configurator? What’s weak about it? Your notes here become the pitch.
          </button>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <div className="grid content-start gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Current tool</div>
                <div className="mt-1">
                  <ConfiguratorCell c={company} />
                </div>
              </div>
              {c.url ? (
                <a
                  href={toUrl(c.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open configurator <ExternalLink className="size-3" />
                </a>
              ) : null}
              <div>
                <div className="text-xs text-muted-foreground">You can build</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {company.opportunities.length ? (
                    company.opportunities.map((o) => (
                      <span key={o} className="rounded-md bg-brand px-2 py-0.5 text-xs font-medium text-white">
                        {o}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="text-xs font-medium text-muted-foreground">Weaknesses / pitch angle</div>
              <p className="mt-1 text-sm whitespace-pre-line">
                {c.weaknesses || <span className="text-muted-foreground">No notes yet.</span>}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FollowUpCard({ company, defaultDays }: { company: CompanyDTO; defaultDays: number }) {
  const { pending, run } = useRunAction();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(toInputDate(company.followUpAt) || inputDatePlus(defaultDays || 5));
  const [note, setNote] = useState(company.followUpNote);
  const diff = company.followUpAt ? daysFromToday(company.followUpAt) : null;
  const overdue = diff !== null && diff < 0;
  const today = diff === 0;

  return (
    <Card className={cn(overdue && "border-destructive/40", today && "border-warning/40")}>
      <CardHeader>
        <CardTitle>
          <AlarmClock className={cn("size-4 text-primary", overdue && "text-destructive", today && "text-warning")} /> Next follow-up
        </CardTitle>
        {company.followUpAt && !editing ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil /> Change
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3">
        {company.followUpAt && !editing ? (
          <>
            <div>
              <div
                suppressHydrationWarning
                className={cn("text-lg font-semibold", overdue && "text-destructive", today && "text-warning")}
              >
                {overdue ? `${-diff!} days overdue` : today ? "Today" : relativeDay(company.followUpAt)}
              </div>
              <div className="text-xs text-muted-foreground">{fmtDate(company.followUpAt, "EEEE, d MMM yyyy")}</div>
              {company.followUpNote ? <p className="mt-2 text-sm">{company.followUpNote}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="soft"
                disabled={pending}
                onClick={() => run(() => setFollowUp(company._id, null), { success: "Follow-up done" })}
              >
                <Check /> Done
              </Button>
              {[1, 3, 7].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => snoozeFollowUp(company._id, d), { success: `Snoozed ${d} day${d > 1 ? "s" : ""}` })}
                >
                  +{d}d
                </Button>
              ))}
            </div>
          </>
        ) : editing || !company.followUpAt ? (
          <form
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => setFollowUp(company._id, date, note), {
                success: "Follow-up set",
                onSuccess: () => setEditing(false),
              });
            }}
          >
            {!company.followUpAt && !editing ? (
              <p className="text-sm text-muted-foreground">No follow-up planned.</p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {[3, 5, 7, 14].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(inputDatePlus(d))}
                  className={cn(
                    "h-7 rounded-md border px-2 text-xs",
                    date === inputDatePlus(d) ? "border-primary/60 bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  {d === 7 ? "1w" : d === 14 ? "2w" : `${d}d`}
                </button>
              ))}
            </div>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8" />
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What to do then?" className="h-8" />
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={pending || !date}>
                <CalendarPlus /> Set follow-up
              </Button>
              {editing ? (
                <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ResearchCard({ company }: { company: CompanyDTO }) {
  const { run } = useRunAction();
  const done = RESEARCH_STEPS.filter((s) => company.research?.[s.key]).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <ClipboardCheck className="size-4 text-primary" /> Research
        </CardTitle>
        <span className="text-xs text-muted-foreground tabular-nums">
          {done}/{RESEARCH_STEPS.length}
        </span>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Progress value={(done / RESEARCH_STEPS.length) * 100} />
        <div className="grid gap-2">
          {RESEARCH_STEPS.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={Boolean(company.research?.[s.key])}
                onCheckedChange={(v) =>
                  run(() => setResearchStep(company._id, s.key, v === true), {
                    onSuccess: (d) => {
                      if (d?.movedTo) toast.success("Research complete — moved to Ready to contact");
                    },
                  })
                }
              />
              <span className={cn(company.research?.[s.key] && "text-muted-foreground line-through")}>{s.label}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailsCard({ company, onEdit }: { company: CompanyDTO; onEdit: () => void }) {
  const rows: [string, React.ReactNode][] = [
    ["Country", company.country || company.city ? <CountryLabel code={company.country} city={company.city} /> : null],
    ["Type", company.type ? COMPANY_TYPE_LABEL[company.type] : null],
    ["Products", company.segments.length ? company.segments.join(", ") : null],
    ["Source", company.source || null],
    [
      "Tags",
      company.tags.length ? (
        <span className="flex flex-wrap justify-end gap-1">
          {company.tags.map((t) => (
            <span key={t} className="rounded-md bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
              {t}
            </span>
          ))}
        </span>
      ) : null,
    ],
    ["Added", fmtDate(company.createdAt)],
    ["In this status since", company.statusChangedAt ? fmtDate(company.statusChangedAt) : null],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Info className="size-4 text-primary" /> Details
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil /> Edit
        </Button>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2.5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4">
              <dt className="shrink-0 text-muted-foreground">{k}</dt>
              <dd className="min-w-0 text-right">{v ?? <span className="text-muted-foreground/60">—</span>}</dd>
            </div>
          ))}
          {company.closedReason && (company.status === "lost" || company.status === "not_fit") ? (
            <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
              <span className="font-medium">Reason: </span>
              {company.closedReason}
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

function ProjectsCard({ projects, onNew }: { projects: ProjectDTO[]; onNew: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Briefcase className="size-4 text-primary" /> Projects
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onNew}>
          <Plus /> New
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet. When they say yes, start one here.</p>
        ) : (
          projects.map((p) => {
            const f = p.finance!;
            const pct = f.expected > 0 ? (f.received / f.expected) * 100 : 0;
            return (
              <Link key={p._id} href={`/projects/${p._id}`} className="grid gap-2 rounded-xl border p-3 transition-colors hover:bg-accent/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{p.title}</span>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{BILLING_LABEL[p.billing]}</span>
                  <span className="tabular-nums">
                    {formatMoney(f.received, p.currency)} / {formatMoney(f.expected, p.currency)}
                  </span>
                </div>
                <Progress value={pct} indicatorClassName={pct >= 100 ? "bg-success" : undefined} />
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function TasksCard({ tasks, onNew }: { tasks: TaskDTO[]; onNew: () => void }) {
  const { run } = useRunAction();
  const open = tasks.filter((t) => !t.done);
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CheckSquare className="size-4 text-primary" /> Tasks
          {open.length ? <span className="text-sm font-normal text-muted-foreground">{open.length}</span> : null}
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onNew}>
          <Plus /> New
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to do for this company.</p>
        ) : (
          tasks.slice(0, 8).map((t) => (
            <label key={t._id} className="flex items-start gap-2.5 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={t.done}
                onCheckedChange={(v) => run(() => toggleTask(t._id, v === true))}
              />
              <span className={cn("min-w-0 flex-1", t.done && "text-muted-foreground line-through")}>{t.title}</span>
              {t.dueDate ? (
                <span suppressHydrationWarning className="shrink-0 text-xs text-muted-foreground">
                  {relativeDay(t.dueDate)}
                </span>
              ) : null}
            </label>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function NotesCard({ company }: { company: CompanyDTO }) {
  const [value, setValue] = useState(company.notes);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const saved = useRef(company.notes);

  useEffect(() => {
    if (value === saved.current) return;
    setState("saving");
    const t = setTimeout(async () => {
      const res = await updateCompanyNotes(company._id, value);
      if (res.ok) {
        saved.current = value;
        setState("saved");
      } else setState("idle");
    }, 800);
    return () => clearTimeout(t);
  }, [value, company._id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <NotebookPen className="size-4 text-primary" /> Notes
        </CardTitle>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {state === "saving" ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving
            </>
          ) : state === "saved" ? (
            <>
              <Check className="size-3" /> Saved
            </>
          ) : null}
        </span>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Anything about this company — auto-saves as you type."
          rows={5}
          className="bg-muted/30"
        />
      </CardContent>
    </Card>
  );
}

