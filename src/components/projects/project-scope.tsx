"use client";

import { useState } from "react";
import { Ban, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";

import { addScopeItems, deleteScopeItem, updateScopeItem } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { ScopeItemDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

export function ScopeCard({ projectId, scope }: { projectId: string; scope: ScopeItemDTO[] }) {
  const { pending, run } = useRunAction();
  const [adding, setAdding] = useState<null | "in" | "out">(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const included = scope.filter((s) => s.included);
  const excluded = scope.filter((s) => !s.included);
  const done = included.filter((s) => s.done).length;

  const add = () =>
    run(() => addScopeItems(projectId, text.split("\n"), adding !== "out"), {
      success: "Scope updated",
      onSuccess: () => {
        setText("");
        setAdding(null);
      },
    });

  const item = (s: ScopeItemDTO) => (
    <li key={s._id} className="group flex items-start gap-2.5 rounded-lg px-1 py-1.5 hover:bg-muted/40">
      {editing === s._id ? (
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateScopeItem(projectId, s._id, { title: editText }), { onSuccess: () => setEditing(null) });
          }}
        >
          <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="h-7" autoFocus />
          <Button size="xs" type="submit" disabled={pending}>
            Save
          </Button>
          <Button size="xs" variant="ghost" type="button" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </form>
      ) : (
        <>
          <label className={cn("flex flex-1 items-start gap-2.5 text-sm", s.included && "cursor-pointer")}>
            {s.included ? (
              <Checkbox
                className="mt-0.5"
                checked={s.done}
                onCheckedChange={(v) => run(() => updateScopeItem(projectId, s._id, { done: v === true }))}
              />
            ) : (
              <Ban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={cn("flex-1", s.done && "text-muted-foreground line-through", !s.included && "text-muted-foreground")}>
              {s.title}
            </span>
          </label>
          <span className="flex opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Edit"
              onClick={() => {
                setEditing(s._id);
                setEditText(s.title);
              }}
            >
              <Pencil />
            </Button>
            <Button size="icon-xs" variant="ghost" aria-label="Delete" onClick={() => run(() => deleteScopeItem(projectId, s._id))}>
              <Trash2 />
            </Button>
          </span>
        </>
      )}
    </li>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <ListChecks className="size-4 text-primary" /> Scope
          {included.length ? (
            <span className="text-sm font-normal text-muted-foreground">
              {done}/{included.length} done
            </span>
          ) : null}
        </CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setAdding("out")}>
            <Ban /> Not included
          </Button>
          <Button size="sm" variant="soft" onClick={() => setAdding("in")}>
            <Plus /> Deliverable
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {included.length ? <Progress value={(done / included.length) * 100} indicatorClassName={done === included.length ? "bg-success" : undefined} /> : null}
        {adding ? (
          <div className="grid gap-2 rounded-xl border bg-muted/30 p-3">
            <span className="text-xs font-medium text-muted-foreground">
              {adding === "in" ? "Deliverables — one per line" : "Not included (protects you from scope creep) — one per line"}
            </span>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus />
            <div className="flex gap-2">
              <Button size="sm" onClick={add} disabled={pending || !text.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
        {scope.length === 0 && !adding ? (
          <p className="text-sm text-muted-foreground">
            List what you’ll deliver — and what’s <i>not</i> included. Clear scope = no arguments later.
          </p>
        ) : null}
        {included.length ? <ul className="grid">{included.map(item)}</ul> : null}
        {excluded.length ? (
          <div className="grid gap-1">
            <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Not included</div>
            <ul className="grid">{excluded.map(item)}</ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
