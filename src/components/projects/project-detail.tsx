"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Check,
  CheckSquare,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Plus,
  Receipt,
  Repeat,
  Rocket,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { deleteProject, deleteProjectLink, addProjectLink, setProjectStatus, updateProjectNotes } from "@/actions/projects";
import { toggleTask } from "@/actions/tasks";
import { InvoiceStatusBadge, ProjectStatusBadge } from "@/components/badges";
import { CompanyLogo } from "@/components/company-logo";
import { ConfirmDialog } from "@/components/confirm";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { useQuickActions } from "@/components/shell/quick-actions";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BILLING_LABEL, PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants";
import { daysFromToday, fmtDate, periodLabel, relativeDay, toDate } from "@/lib/dates";
import { invoiceTotals } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import { toUrl } from "@/lib/normalize";
import type { InvoiceDTO, MilestoneDTO, PaymentDTO, ProjectDTO, SettingsDTO, TaskDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

import { MilestonesCard } from "./project-milestones";
import { MonthGrid } from "./month-grid";
import { PaymentsList } from "./payments-list";
import { ProjectDialog } from "./project-dialog";
import { ScopeCard } from "./project-scope";

type Data = { project: ProjectDTO; payments: PaymentDTO[]; tasks: TaskDTO[]; invoices: InvoiceDTO[] };

export function ProjectDetail({ data, settings }: { data: Data; settings: SettingsDTO }) {
  const { project, payments, tasks, invoices } = data;
  const router = useRouter();
  const quick = useQuickActions();
  const { run } = useRunAction();
  const [editOpen, setEditOpen] = useState(false);
  const [pay, setPay] = useState<{ key: number; milestoneId?: string; period?: string; amount?: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const f = project.finance!;
  const cur = project.currency;
  const milestoneNames = Object.fromEntries(project.milestones.map((m) => [m._id, m.title]));

  const openPay = (opts: { milestoneId?: string; period?: string; amount?: number } = {}) =>
    setPay({ key: Date.now(), ...opts });

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <CompanyLogo name={project.company?.name ?? "?"} domain={project.company?.domain} className="size-14 rounded-2xl text-base" />
            <div className="min-w-0">
              <Link href="/projects" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3" /> Projects
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {project.company ? (
                  <Link href={`/marketing/companies/${project.company._id}`} className="hover:text-primary">
                    {project.company.name}
                  </Link>
                ) : null}
                {project.type ? <span>{project.type}</span> : null}
                <span className="inline-flex items-center gap-1">
                  {project.billing === "monthly" ? <Repeat className="size-3.5" /> : <Rocket className="size-3.5" />}
                  {BILLING_LABEL[project.billing]}
                </span>
              </div>
              <div className="mt-3">
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                    <ProjectStatusBadge status={project.status} className="cursor-pointer py-1 text-[13px]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {PROJECT_STATUSES.map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onClick={() => run(() => setProjectStatus(project._id, s.value as ProjectStatus), { success: `Status: ${s.label}` })}
                      >
                        <ProjectStatusBadge status={s.value} />
                        {project.status === s.value ? <Check className="ml-auto" /> : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {project.description ? <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{project.description}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => openPay()}>
              <Receipt /> Payment received
            </Button>
            <Button variant="outline" onClick={() => quick.open("invoice", { companyId: project.companyId, projectId: project._id })}>
              <FileText /> Invoice
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil /> Edit project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => quick.open("task", { projectId: project._id, companyId: project.companyId })}>
                  <CheckSquare /> New task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 /> Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Money */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {project.billing === "monthly" ? (
          <>
            <StatCard label="Monthly amount" value={formatMoney(project.monthlyAmount, cur)} icon={Repeat} hint={`Billed on day ${project.billingDay}`} />
            <StatCard label="Billed so far" value={formatMoney(f.expected, cur)} icon={CalendarRange} hint={`${Math.round(f.expected / (project.monthlyAmount || 1))} months`} />
          </>
        ) : (
          <>
            <StatCard label="Contract value" value={formatMoney(project.value, cur)} icon={Wallet} />
            <StatCard
              label="Deadline"
              value={project.dueDate ? fmtDate(project.dueDate, "d MMM") : "—"}
              icon={CalendarRange}
              hint={project.dueDate ? <span suppressHydrationWarning>{relativeDay(project.dueDate)}</span> : "Not set"}
            />
          </>
        )}
        <StatCard label="Received" value={formatMoney(f.received, cur)} icon={Receipt} tone="brand" hint={`${payments.length} payment${payments.length === 1 ? "" : "s"}`} />
        <StatCard
          label="Pending"
          value={formatMoney(f.pending, cur)}
          icon={Wallet}
          tone={f.pending > 0 ? "warning" : "success"}
          hint={
            project.billing === "monthly" && f.unpaidPeriods.length
              ? `Unpaid: ${f.unpaidPeriods.map((p) => periodLabel(p, "MMM")).join(", ")}`
              : f.pending > 0
                ? "Still to collect"
                : "All collected"
          }
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <TimelineCard project={project} payments={payments} onPay={(period) => openPay({ period, amount: project.monthlyAmount })} />
          <ScopeCard projectId={project._id} scope={project.scope} />
          {project.billing === "one_time" || project.milestones.length ? (
            <MilestonesCard project={project} onPay={(m: MilestoneDTO) => openPay({ milestoneId: m._id, amount: Math.max(0, m.amount - (m.paid ?? 0)) })} />
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>
                <Receipt className="size-4 text-primary" /> Payments
              </CardTitle>
              <Button size="sm" variant="soft" onClick={() => openPay()}>
                <Plus /> Record
              </Button>
            </CardHeader>
            <CardContent>
              <PaymentsList payments={payments} milestoneNames={milestoneNames} />
            </CardContent>
          </Card>
        </div>
        <div className="grid min-w-0 gap-5">
          <ProjectTasks tasks={tasks} onNew={() => quick.open("task", { projectId: project._id, companyId: project.companyId })} />
          <ProjectInvoices invoices={invoices} onNew={() => quick.open("invoice", { companyId: project.companyId, projectId: project._id })} />
          <LinksCard project={project} />
          <NotesCard project={project} />
        </div>
      </div>

      {editOpen ? (
        <ProjectDialog open onOpenChange={setEditOpen} project={project} defaultCurrency={settings.defaultCurrency} />
      ) : null}
      {pay ? (
        <PaymentDialog
          key={pay.key}
          open
          onOpenChange={(o) => !o && setPay(null)}
          presetProjectId={project._id}
          presetMilestoneId={pay.milestoneId}
          presetPeriod={pay.period}
          presetAmount={pay.amount}
        />
      ) : null}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${project.title}?`}
        description="Removes the project and its tasks. Projects with payments or invoices can’t be deleted."
        onConfirm={() => run(() => deleteProject(project._id), { success: "Project deleted", onSuccess: () => router.push("/projects") })}
      />
    </div>
  );
}

function TimelineCard({
  project,
  payments,
  onPay,
}: {
  project: ProjectDTO;
  payments: PaymentDTO[];
  onPay: (period: string) => void;
}) {
  if (project.billing === "monthly") return <MonthlyCard project={project} payments={payments} onPay={onPay} />;
  return <DeadlineCard project={project} />;
}

function MonthlyCard({
  project,
  payments,
  onPay,
}: {
  project: ProjectDTO;
  payments: PaymentDTO[];
  onPay: (period: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CalendarRange className="size-4 text-primary" /> Monthly payments
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          Since {fmtDate(project.startDate ?? project.createdAt, "MMM yyyy")}
          {project.endDate ? ` · ends ${fmtDate(project.endDate, "MMM yyyy")}` : ""}
        </span>
      </CardHeader>
      <CardContent>
        <MonthGrid project={project} payments={payments} onPay={onPay} />
      </CardContent>
    </Card>
  );
}

function DeadlineCard({ project }: { project: ProjectDTO }) {
  const [now] = useState(() => Date.now());
  const start = toDate(project.startDate ?? project.createdAt);
  const end = toDate(project.dueDate);
  if (project.billing === "monthly" || !start || !end || end <= start) {
    return null;
  }
  const total = end.getTime() - start.getTime();
  const pct = Math.max(0, Math.min(100, ((now - start.getTime()) / total) * 100));
  const left = daysFromToday(end);
  const pos = (d: string | null) => {
    const t = toDate(d);
    return t ? Math.max(0, Math.min(100, ((t.getTime() - start.getTime()) / total) * 100)) : null;
  };
  const closed = ["delivered", "completed", "cancelled"].includes(project.status);
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CalendarRange className="size-4 text-primary" /> Timeline
        </CardTitle>
        <span
          suppressHydrationWarning
          className={cn(
            "text-xs font-medium",
            !closed && left !== null && left < 0 ? "text-destructive" : !closed && left !== null && left <= 7 ? "text-warning" : "text-muted-foreground",
          )}
        >
          {closed ? "Finished" : left !== null && left < 0 ? `${-left} days past deadline` : `${left} days left`}
        </span>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="relative pt-5 pb-6">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", pct >= 100 && !closed ? "bg-destructive" : "bg-brand")} style={{ width: `${pct}%` }} />
          </div>
          {project.milestones.map((m) => {
            const p = pos(m.dueDate);
            if (p === null) return null;
            return (
              <span
                key={m._id}
                title={`${m.title} · ${fmtDate(m.dueDate)}`}
                className={cn(
                  "absolute top-[18px] size-3.5 -translate-x-1/2 rounded-full border-2 border-card",
                  m.done ? "bg-success" : "bg-muted-foreground/60",
                )}
                style={{ left: `${p}%` }}
              />
            );
          })}
          {!closed && pct > 0 && pct < 100 ? (
            <span className="absolute top-0 -translate-x-1/2 text-[10px] font-semibold text-primary" style={{ left: `${pct}%` }} suppressHydrationWarning>
              Today
            </span>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs text-muted-foreground">
            <span>{fmtDate(start, "d MMM")}</span>
            <span>{fmtDate(end, "d MMM yyyy")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectTasks({ tasks, onNew }: { tasks: TaskDTO[]; onNew: () => void }) {
  const { run } = useRunAction();
  const open = tasks.filter((t) => !t.done).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CheckSquare className="size-4 text-primary" /> Tasks
          {tasks.length ? (
            <span className="text-sm font-normal text-muted-foreground">
              {tasks.length - open}/{tasks.length}
            </span>
          ) : null}
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onNew}>
          <Plus /> New
        </Button>
      </CardHeader>
      <CardContent className="grid gap-1.5">
        {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks yet.</p> : null}
        {tasks.map((t) => (
          <label key={t._id} className="flex items-start gap-2.5 py-0.5 text-sm">
            <Checkbox className="mt-0.5" checked={t.done} onCheckedChange={(v) => run(() => toggleTask(t._id, v === true))} />
            <span className={cn("flex-1", t.done && "text-muted-foreground line-through")}>{t.title}</span>
            {t.dueDate ? (
              <span suppressHydrationWarning className="shrink-0 text-xs text-muted-foreground">
                {relativeDay(t.dueDate)}
              </span>
            ) : null}
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

function ProjectInvoices({ invoices, onNew }: { invoices: InvoiceDTO[]; onNew: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <FileText className="size-4 text-primary" /> Invoices
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onNew}>
          <Plus /> New
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {invoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices for this project.</p> : null}
        {invoices.map((inv) => {
          const overdue = inv.status === "sent" && inv.dueDate && new Date(inv.dueDate) < new Date();
          return (
            <Link key={inv._id} href={`/finance/invoices/${inv._id}`} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent/40">
              <span className="font-medium">{inv.number}</span>
              <InvoiceStatusBadge status={inv.status} overdue={Boolean(overdue)} />
              <span className="ml-auto tabular-nums">{formatMoney(invoiceTotals(inv).total, inv.currency)}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function LinksCard({ project }: { project: ProjectDTO }) {
  const { pending, run } = useRunAction();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link2 className="size-4 text-primary" /> Links
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
          <Plus /> Add
        </Button>
      </CardHeader>
      <CardContent className="grid gap-1.5">
        {adding ? (
          <form
            className="grid gap-2 rounded-lg border bg-muted/30 p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => addProjectLink(project._id, label, url), {
                onSuccess: () => {
                  setAdding(false);
                  setLabel("");
                  setUrl("");
                },
              });
            }}
          >
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (Figma, repo, staging…)" className="h-8" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="h-8" required />
            <div className="flex gap-2">
              <Button size="xs" type="submit" disabled={pending}>
                Save
              </Button>
              <Button size="xs" type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
        {project.links.length === 0 && !adding ? <p className="text-sm text-muted-foreground">Contract, Figma, repo, staging URL…</p> : null}
        {project.links.map((l) => (
          <div key={l._id} className="group flex items-center gap-2 text-sm">
            <a href={toUrl(l.url)} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-1.5 text-primary hover:underline">
              <ExternalLink className="size-3.5 shrink-0" />
              <span className="truncate">{l.label || l.url}</span>
            </a>
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive max-sm:opacity-100"
              aria-label="Remove link"
              onClick={() => run(() => deleteProjectLink(project._id, l._id))}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NotesCard({ project }: { project: ProjectDTO }) {
  const [value, setValue] = useState(project.notes);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const saved = useRef(project.notes);
  useEffect(() => {
    if (value === saved.current) return;
    const t = setTimeout(async () => {
      setState("saving");
      const res = await updateProjectNotes(project._id, value);
      if (res.ok) {
        saved.current = value;
        setState("saved");
      } else setState("idle");
    }, 800);
    return () => clearTimeout(t);
  }, [value, project._id]);
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
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={5} placeholder="Decisions, credentials location, feedback…" className="bg-muted/30" />
      </CardContent>
    </Card>
  );
}
