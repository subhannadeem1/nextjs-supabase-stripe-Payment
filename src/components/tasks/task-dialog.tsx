"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { listCompanyOptions } from "@/actions/companies";
import { listProjectOptions } from "@/actions/projects";
import { createTask, updateTask } from "@/actions/tasks";
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
import { TASK_PRIORITIES, type TaskPriority } from "@/lib/constants";
import { inputDatePlus, toInputDate, todayInput } from "@/lib/dates";
import type { TaskDTO } from "@/lib/types";
import { useOptions } from "@/lib/use-options";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

export function TaskDialog({
  open,
  onOpenChange,
  presetCompanyId,
  presetProjectId,
  task,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetCompanyId?: string;
  presetProjectId?: string;
  task?: TaskDTO;
}) {
  const { pending, run } = useRunAction();
  const { options: companies } = useOptions(listCompanyOptions, open);
  const { options: projects } = useOptions(listProjectOptions, open);
  const [form, setForm] = useState({
    title: task?.title ?? "",
    notes: task?.notes ?? "",
    dueDate: task ? toInputDate(task.dueDate) : todayInput(),
    priority: (task?.priority ?? "normal") as TaskPriority,
    companyId: task?.companyId ?? presetCompanyId ?? "",
    projectId: task?.projectId ?? presetProjectId ?? "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const payload = { ...form, dueDate: form.dueDate || null, companyId: form.companyId || null, projectId: form.projectId || null };
    run(() => (task ? updateTask(task._id, payload) : createTask(payload)), {
      success: task ? "Task saved" : "Task added",
      onSuccess: () => onOpenChange(false),
    });
  };

  const dueChips = [
    { label: "Today", v: todayInput() },
    { label: "Tomorrow", v: inputDatePlus(1) },
    { label: "In 3 days", v: inputDatePlus(3) },
    { label: "Next week", v: inputDatePlus(7) },
    { label: "No date", v: "" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>Anything you shouldn’t forget.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Task">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required autoFocus placeholder="e.g. Prepare 3D demo for SUN-AGE" />
          </Field>
          <Field label="Due">
            <div className="flex flex-wrap items-center gap-1.5">
              {dueChips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => set("dueDate", c.v)}
                  className={cn(
                    "h-8 rounded-lg border px-2.5 text-[13px]",
                    form.dueDate === c.v ? "border-primary/60 bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  {c.label}
                </button>
              ))}
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className="h-8 w-[150px]" />
            </div>
          </Field>
          <Field label="Priority">
            <div className="flex gap-1.5">
              {TASK_PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set("priority", p.value)}
                  className={cn(
                    "h-8 flex-1 rounded-lg border text-[13px]",
                    form.priority === p.value ? "border-primary/60 bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company (optional)">
              <Combobox
                value={form.companyId}
                onChange={(v) => {
                  set("companyId", v);
                  if (v && form.projectId && projects.find((p) => p.value === form.projectId)?.companyId !== v) set("projectId", "");
                }}
                options={companies.map((c) => ({ value: c.value, label: c.label }))}
                placeholder="None"
              />
            </Field>
            <Field label="Project (optional)">
              <SelectField
                value={form.projectId}
                onChange={(v) => {
                  set("projectId", v);
                  const p = projects.find((x) => x.value === v);
                  if (p) set("companyId", p.companyId);
                }}
                options={projects
                  .filter((p) => !form.companyId || p.companyId === form.companyId)
                  .map((p) => ({ value: p.value, label: p.label }))}
                allowEmpty
                emptyLabel="None"
                placeholder="None"
              />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.title.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {task ? "Save" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
