"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Loader2, MoreHorizontal, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";

import { deleteDemo, saveDemo } from "@/actions/library";
import { OutcomeBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm";
import { EmptyState } from "@/components/empty-state";
import { Field, SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { OPPORTUNITIES, type Outcome } from "@/lib/constants";
import { fmtShort, relativeDay } from "@/lib/dates";
import { toUrl } from "@/lib/normalize";
import type { DemoDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

type DemoRow = DemoDTO & {
  sends: { companyId: string; companyName: string; contactName: string; date: string; outcome: string }[];
};

export function DemosView({ demos }: { demos: DemoRow[] }) {
  const { run } = useRunAction();
  const [editing, setEditing] = useState<{ key: number; demo: DemoRow | null } | null>(null);
  const [toDelete, setToDelete] = useState<DemoRow | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid gap-5">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ key: Date.now(), demo: null })}>
          <Plus /> Add demo
        </Button>
      </div>
      {demos.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No demos saved"
          description="Keep your demo videos and live links here. When you log “Demo sent”, pick one and it’s tracked who got what."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demos.map((d) => (
            <div key={d._id} className="flex flex-col rounded-xl border bg-card">
              <div className="flex items-start gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-brand">
                  <PlayCircle className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">{d.product || "Demo"}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Demo actions">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing({ key: Date.now(), demo: d })}>
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setToDelete(d)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {d.description ? <p className="line-clamp-3 px-4 text-sm text-muted-foreground">{d.description}</p> : null}
              <div className="mt-auto flex items-center gap-3 px-4 pt-4 pb-3 text-sm">
                <a href={toUrl(d.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  Open demo <ExternalLink className="size-3" />
                </a>
                <span className="ml-auto text-xs text-muted-foreground" suppressHydrationWarning>
                  Sent {d.sentCount ?? 0}×{d.lastSentAt ? ` · last ${relativeDay(d.lastSentAt)}` : ""}
                </span>
              </div>
              {d.sends.length ? (
                <div className="border-t">
                  <button
                    type="button"
                    onClick={() => setOpen(open === d._id ? null : d._id)}
                    className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                  >
                    Who got it
                    <ChevronDown className={cn("size-4 transition-transform", open === d._id && "rotate-180")} />
                  </button>
                  {open === d._id ? (
                    <ul className="grid gap-1.5 px-4 pb-3">
                      {d.sends.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <Link href={`/marketing/companies/${s.companyId}`} className="truncate font-medium hover:text-primary">
                            {s.companyName}
                          </Link>
                          {s.contactName ? <span className="truncate text-muted-foreground">· {s.contactName}</span> : null}
                          <OutcomeBadge outcome={s.outcome as Outcome | ""} className="ml-auto py-0 text-[10px]" />
                          <span className="shrink-0 text-muted-foreground">{fmtShort(s.date)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {editing ? <DemoEditor key={editing.key} demo={editing.demo} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete “${toDelete?.title}”?`}
        description="The outreach history keeps the link, only the library entry is removed."
        onConfirm={() => toDelete && run(() => deleteDemo(toDelete._id), { success: "Demo deleted" })}
      />
    </div>
  );
}

function DemoEditor({ demo, onClose }: { demo: DemoRow | null; onClose: () => void }) {
  const { pending, run } = useRunAction();
  const [form, setForm] = useState({
    title: demo?.title ?? "",
    product: demo?.product ?? "",
    url: demo?.url ?? "",
    description: demo?.description ?? "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{demo ? "Edit demo" : "Add demo"}</DialogTitle>
          <DialogDescription>A video (Loom, YouTube, Drive) or a live link.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveDemo(demo?._id ?? null, form), { success: "Demo saved", onSuccess: onClose });
          }}
        >
          <Field label="Name">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. 3D carport configurator — walkthrough" />
          </Field>
          <Field label="Product">
            <SelectField
              value={form.product}
              onChange={(v) => set("product", v)}
              options={OPPORTUNITIES.map((o) => ({ value: o, label: o }))}
              allowEmpty
              emptyLabel="Not set"
              placeholder="Not set"
            />
          </Field>
          <Field label="Link">
            <Input value={form.url} onChange={(e) => set("url", e.target.value)} required placeholder="https://…" />
          </Field>
          <Field label="What it shows">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
