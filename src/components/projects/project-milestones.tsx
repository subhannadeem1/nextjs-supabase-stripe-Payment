"use client";

import { useState } from "react";
import { Flag, MoreHorizontal, Pencil, Plus, Receipt, Trash2 } from "lucide-react";

import { addMilestone, deleteMilestone, updateMilestone } from "@/actions/projects";
import { ConfirmDialog } from "@/components/confirm";
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
import { daysFromToday, fmtDate, toInputDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { MilestoneDTO, ProjectDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

export function MilestonesCard({
  project,
  onPay,
}: {
  project: ProjectDTO;
  onPay: (m: MilestoneDTO) => void;
}) {
  const { pending, run } = useRunAction();
  const [form, setForm] = useState<{ id: string | null; title: string; dueDate: string; amount: string } | null>(null);
  const [toDelete, setToDelete] = useState<MilestoneDTO | null>(null);
  const total = project.milestones.reduce((s, m) => s + m.amount, 0);
  const cur = project.currency;

  const save = () => {
    if (!form) return;
    const payload = { title: form.title, dueDate: form.dueDate || null, amount: Number(form.amount || 0) };
    run(() => (form.id ? updateMilestone(project._id, form.id, payload) : addMilestone(project._id, payload)), {
      success: form.id ? "Milestone saved" : "Milestone added",
      onSuccess: () => setForm(null),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Flag className="size-4 text-primary" /> Milestones
          {project.milestones.length ? (
            <span className="text-sm font-normal text-muted-foreground tabular-nums">{formatMoney(total, cur)}</span>
          ) : null}
        </CardTitle>
        <Button size="sm" variant="soft" onClick={() => setForm({ id: null, title: "", dueDate: "", amount: "" })}>
          <Plus /> Milestone
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {project.billing === "one_time" && total > 0 && Math.abs(total - project.value) > 0.009 ? (
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            Milestones add up to {formatMoney(total, cur)} but the contract is {formatMoney(project.value, cur)}.
          </p>
        ) : null}
        {form ? (
          <form
            className="grid gap-2 rounded-xl border bg-muted/30 p-3 sm:grid-cols-[1fr_140px_120px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 50% upfront, MVP delivered…" required autoFocus />
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} aria-label="Due date" />
            <Input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={`Amount (${cur})`} />
            <div className="flex gap-1">
              <Button size="sm" type="submit" disabled={pending}>
                Save
              </Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setForm(null)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
        {project.milestones.length === 0 && !form ? (
          <p className="text-sm text-muted-foreground">Split the work (and the money) into steps, e.g. 40% upfront · 40% on delivery · 20% after launch.</p>
        ) : null}
        {project.milestones.map((m) => {
          const paid = m.paid ?? 0;
          const payState = m.amount <= 0 ? null : paid >= m.amount - 0.009 ? "paid" : paid > 0 ? "partial" : "unpaid";
          const diff = daysFromToday(m.dueDate);
          const late = !m.done && diff !== null && diff < 0;
          return (
            <div key={m._id} className="flex items-center gap-3 rounded-xl border p-3">
              <Checkbox
                checked={m.done}
                onCheckedChange={(v) => run(() => updateMilestone(project._id, m._id, { done: v === true }), { success: v ? "Milestone done 🎉" : undefined })}
                aria-label="Mark delivered"
              />
              <div className="min-w-0 flex-1">
                <div className={cn("truncate text-sm font-medium", m.done && "text-muted-foreground line-through")}>{m.title}</div>
                <div className={cn("text-xs text-muted-foreground", late && "text-destructive")} suppressHydrationWarning>
                  {m.dueDate ? `Due ${fmtDate(m.dueDate)}${late ? ` · ${-diff!}d late` : ""}` : "No due date"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">{formatMoney(m.amount, cur)}</div>
                {payState ? (
                  <div
                    className={cn(
                      "text-[11px] font-medium",
                      payState === "paid" && "text-success",
                      payState === "partial" && "text-warning",
                      payState === "unpaid" && "text-muted-foreground",
                    )}
                  >
                    {payState === "paid" ? "Paid" : payState === "partial" ? `${formatMoney(paid, cur)} paid` : "Unpaid"}
                  </div>
                ) : null}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label="Milestone actions">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {payState && payState !== "paid" ? (
                    <DropdownMenuItem onClick={() => onPay(m)}>
                      <Receipt /> Record payment
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onClick={() => setForm({ id: m._id, title: m.title, dueDate: toInputDate(m.dueDate), amount: String(m.amount || "") })}
                  >
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setToDelete(m)}>
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </CardContent>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete “${toDelete?.title}”?`}
        description="Payments stay recorded, they just won’t be linked to this milestone."
        onConfirm={() => toDelete && run(() => deleteMilestone(project._id, toDelete._id), { success: "Milestone deleted" })}
      />
    </Card>
  );
}
