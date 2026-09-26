"use client";

import { useRef, useState } from "react";
import { Copy, Loader2, MessageSquareText, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";

import { addStarterTemplates, deleteTemplate, duplicateTemplate, saveTemplate } from "@/actions/library";
import { ConfirmDialog } from "@/components/confirm";
import { EmptyState } from "@/components/empty-state";
import { Field, SelectField } from "@/components/form";
import { ChannelIcon, CHANNEL_TINT } from "@/components/icons";
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
import { ACTIVITY_KIND_LABEL, CHANNEL_LABEL, CHANNELS, TEMPLATE_VARIABLES, type Channel } from "@/lib/constants";
import { renderTemplate } from "@/lib/templates";
import type { TemplateDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

const KINDS = [
  { value: "intro", label: ACTIVITY_KIND_LABEL.intro },
  { value: "proposal", label: ACTIVITY_KIND_LABEL.proposal },
  { value: "demo", label: ACTIVITY_KIND_LABEL.demo },
  { value: "follow_up", label: ACTIVITY_KIND_LABEL.follow_up },
] as const;

const SAMPLE = {
  firstName: "Mattia",
  fullName: "Mattia Vanzo",
  role: "CEO",
  company: "SUN-AGE",
  country: "Italy",
  website: "sun-age.it",
  weakness: "the current tool is 2D only and hard to use on mobile",
  opportunity: "3D Configurator",
  myName: "",
  myBusiness: "",
};

export function TemplatesView({ templates, me }: { templates: TemplateDTO[]; me: { ownerName: string; businessName: string } }) {
  const { pending, run } = useRunAction();
  const [editing, setEditing] = useState<{ key: number; template: TemplateDTO | null } | null>(null);
  const [toDelete, setToDelete] = useState<TemplateDTO | null>(null);
  const sample = { ...SAMPLE, myName: me.ownerName || "Your Name", myBusiness: me.businessName || "Your Business" };

  const header = (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={pending} onClick={() => run(() => addStarterTemplates(), { success: "Starter templates added" })}>
        <Sparkles /> Add starter templates
      </Button>
      <Button onClick={() => setEditing({ key: Date.now(), template: null })}>
        <Plus /> New template
      </Button>
    </div>
  );

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          Write each pitch once. On any company page press <b>Use template</b> — names, weaknesses and opportunities fill in automatically.
        </p>
        {header}
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No templates yet"
          description="Start with the ready-made ones (LinkedIn note, proposal, email, follow-up, demo) and edit them to your voice."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <div key={t._id} className="flex flex-col rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", CHANNEL_TINT[t.channel])}>
                  <ChannelIcon channel={t.channel} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {CHANNEL_LABEL[t.channel]} · {ACTIVITY_KIND_LABEL[t.kind]}
                    {t.usedCount ? ` · used ${t.usedCount}×` : ""}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Template actions">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing({ key: Date.now(), template: t })}>
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => run(() => duplicateTemplate(t._id), { success: "Duplicated" })}>
                      <Copy /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setToDelete(t)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {t.subject ? <div className="mt-3 truncate text-sm font-medium">{t.subject}</div> : null}
              <p className="mt-2 line-clamp-6 flex-1 text-sm whitespace-pre-line text-muted-foreground">{t.body}</p>
              <Button variant="soft" size="sm" className="mt-4 w-fit" onClick={() => setEditing({ key: Date.now(), template: t })}>
                <Pencil /> Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <TemplateEditor key={editing.key} template={editing.template} sample={sample} onClose={() => setEditing(null)} />
      ) : null}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete “${toDelete?.title}”?`}
        onConfirm={() => toDelete && run(() => deleteTemplate(toDelete._id), { success: "Template deleted" })}
      />
    </div>
  );
}

function TemplateEditor({
  template,
  sample,
  onClose,
}: {
  template: TemplateDTO | null;
  sample: Record<string, string>;
  onClose: () => void;
}) {
  const { pending, run } = useRunAction();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState({
    title: template?.title ?? "",
    channel: (template?.channel ?? "linkedin_message") as Channel,
    kind: template?.kind ?? ("intro" as TemplateDTO["kind"]),
    subject: template?.subject ?? "",
    body: template?.body ?? "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const insert = (key: string) => {
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    if (!el) return set("body", form.body + token);
    const start = el.selectionStart ?? form.body.length;
    const end = el.selectionEnd ?? form.body.length;
    const next = form.body.slice(0, start) + token + form.body.slice(end);
    set("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>Use variables like {"{{firstName}}"} — they’re filled from the company and person.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5 lg:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveTemplate(template?._id ?? null, form), { success: "Template saved", onSuccess: onClose });
          }}
        >
          <div className="grid content-start gap-4">
            <Field label="Name">
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. LinkedIn proposal — Italy" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Channel">
                <SelectField value={form.channel} onChange={(v) => set("channel", (v || "linkedin_message") as Channel)} options={CHANNELS} />
              </Field>
              <Field label="Logged as">
                <SelectField value={form.kind} onChange={(v) => set("kind", (v || "intro") as TemplateDTO["kind"])} options={KINDS} />
              </Field>
            </div>
            {form.channel === "email" ? (
              <Field label="Subject">
                <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
              </Field>
            ) : null}
            <Field label="Message">
              <Textarea ref={bodyRef} value={form.body} onChange={(e) => set("body", e.target.value)} rows={12} required />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  title={v.hint}
                  onClick={() => insert(v.key)}
                  className="rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
            </div>
            {form.channel === "linkedin_connect" && form.body.length > 300 ? (
              <p className="text-xs text-warning">LinkedIn connection notes are limited to 300 characters ({form.body.length} now).</p>
            ) : null}
          </div>
          <div className="grid content-start gap-2">
            <div className="text-[13px] font-medium">Preview (sample company)</div>
            <div className="rounded-xl border bg-muted/30 p-4">
              {form.channel === "email" && form.subject ? (
                <div className="mb-3 border-b pb-2 text-sm font-medium">{renderTemplate(form.subject, sample)}</div>
              ) : null}
              <p className="text-sm whitespace-pre-line">{renderTemplate(form.body, sample) || <span className="text-muted-foreground">Start typing…</span>}</p>
            </div>
          </div>
          <DialogFooter className="lg:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
