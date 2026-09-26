"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, ChevronDown, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { clearDoneTasks, createTask, deleteTask, toggleTask } from "@/actions/tasks";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { daysFromToday, inputDatePlus, relativeDay, todayInput } from "@/lib/dates";
import type { TaskDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

import { TaskDialog } from "./task-dialog";

const PRIORITY_DOT = { high: "bg-rose-500", normal: "bg-sky-500", low: "bg-slate-400" } as const;

export function TasksView({ tasks }: { tasks: TaskDTO[] }) {
  const { pending, run } = useRunAction();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(todayInput());
  const [editing, setEditing] = useState<{ key: number; task?: TaskDTO } | null>(null);
  const [showDone, setShowDone] = useState(false);

  const groups = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const by = (fn: (d: number | null) => boolean) => open.filter((t) => fn(daysFromToday(t.dueDate)));
    return {
      overdue: by((d) => d !== null && d < 0),
      today: by((d) => d === 0),
      soon: by((d) => d !== null && d > 0 && d <= 7),
      later: by((d) => d !== null && d > 7),
      someday: by((d) => d === null),
      done: tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? "")),
    };
  }, [tasks]);

  const add = () =>
    run(() => createTask({ title, dueDate: due || null }), {
      success: "Task added",
      onSuccess: () => setTitle(""),
    });

  const row = (t: TaskDTO) => {
    const d = daysFromToday(t.dueDate);
    return (
      <li key={t._id} className="group flex items-start gap-3 rounded-xl border bg-card px-3 py-2.5">
        <Checkbox
          className="mt-0.5"
          checked={t.done}
          onCheckedChange={(v) => run(() => toggleTask(t._id, v === true), { success: v ? "Done ✓" : undefined })}
          aria-label={`Complete ${t.title}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOT[t.priority])} title={`${t.priority} priority`} />
            <span className={cn("text-sm", t.done && "text-muted-foreground line-through")}>{t.title}</span>
          </div>
          {t.notes || t.company || t.project ? (
            <div className="mt-0.5 flex flex-wrap gap-x-2 pl-3.5 text-xs text-muted-foreground">
              {t.project ? (
                <Link href={`/projects/${t.project._id}`} className="hover:text-primary">
                  {t.project.title}
                </Link>
              ) : t.company ? (
                <Link href={`/marketing/companies/${t.company._id}`} className="hover:text-primary">
                  {t.company.name}
                </Link>
              ) : null}
              {t.notes ? <span className="truncate">{t.notes}</span> : null}
            </div>
          ) : null}
        </div>
        {t.dueDate && !t.done ? (
          <span
            suppressHydrationWarning
            className={cn("shrink-0 text-xs", d !== null && d < 0 ? "font-medium text-destructive" : d === 0 ? "font-medium text-warning" : "text-muted-foreground")}
          >
            {relativeDay(t.dueDate)}
          </span>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-xs" variant="ghost" aria-label="Task actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing({ key: Date.now(), task: t })}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => run(() => deleteTask(t._id), { success: "Task deleted" })}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  };

  const section = (label: string, list: TaskDTO[], tone?: string) =>
    list.length ? (
      <section className="grid gap-2">
        <h2 className={cn("flex items-center gap-2 text-sm font-semibold", tone)}>
          {label} <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">{list.length}</span>
        </h2>
        <ul className="grid gap-1.5">{list.map(row)}</ul>
      </section>
    ) : null;

  const openCount = tasks.length - groups.done.length;

  return (
    <div className="grid gap-6">
      <form
        className="flex flex-col gap-2 rounded-2xl border bg-card p-3 shadow-xs sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) add();
        }}
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task — e.g. Send invoice to Dome Solar"
          className="h-10 flex-1 border-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: "Today", v: todayInput() },
            { label: "Tomorrow", v: inputDatePlus(1) },
            { label: "Next week", v: inputDatePlus(7) },
            { label: "No date", v: "" },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setDue(c.v)}
              className={cn(
                "h-8 rounded-lg border px-2.5 text-xs",
                due === c.v ? "border-primary/60 bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              {c.label}
            </button>
          ))}
          <Button type="submit" disabled={pending || !title.trim()}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus />} Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing({ key: Date.now() })}>
            More options
          </Button>
        </div>
      </form>

      {openCount === 0 && groups.done.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Nothing to do" description="Add tasks here, or from any company or project page." />
      ) : (
        <>
          {openCount === 0 ? <p className="text-center text-sm text-muted-foreground">All done 🎉</p> : null}
          {section("Overdue", groups.overdue, "text-destructive")}
          {section("Today", groups.today, "text-warning")}
          {section("Next 7 days", groups.soon)}
          {section("Later", groups.later)}
          {section("No date", groups.someday)}
          {groups.done.length ? (
            <section className="grid gap-2">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setShowDone((s) => !s)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <ChevronDown className={cn("size-4 transition-transform", showDone && "rotate-180")} /> Done
                  <span className="rounded-full bg-muted px-2 text-xs">{groups.done.length}</span>
                </button>
                <Button size="sm" variant="ghost" onClick={() => run(() => clearDoneTasks(), { success: "Cleared done tasks" })}>
                  Clear done
                </Button>
              </div>
              {showDone ? <ul className="grid gap-1.5">{groups.done.map(row)}</ul> : null}
            </section>
          ) : null}
        </>
      )}
      {editing ? <TaskDialog key={editing.key} open onOpenChange={(o) => !o && setEditing(null)} task={editing.task} /> : null}
    </div>
  );
}
