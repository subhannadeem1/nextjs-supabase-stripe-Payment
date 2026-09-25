"use client";

import { useMemo, useState } from "react";
import { ExternalLink, History, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { deleteActivity, setActivityOutcome, updateActivity } from "@/actions/activities";
import { OutcomeBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm";
import { Field, SelectField } from "@/components/form";
import { ChannelIcon, CHANNEL_TINT } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ACTIVITY_KIND_LABEL,
  ACTIVITY_KINDS,
  CHANNEL_GROUP,
  CHANNEL_GROUP_LABEL,
  CHANNEL_LABEL,
  CHANNELS,
  COMPANY_STATUS_LABEL,
  OUTCOMES,
  type ActivityKind,
  type Channel,
  type ChannelGroup,
  type CompanyStatus,
  type Outcome,
} from "@/lib/constants";
import { fmtDate, fmtShort, toInputDate } from "@/lib/dates";
import { toUrl } from "@/lib/normalize";
import type { ActivityDTO, ContactDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function TimelineCard({
  activities,
  contacts,
  onLog,
  onNote,
}: {
  activities: ActivityDTO[];
  contacts: ContactDTO[];
  onLog: () => void;
  onNote: () => void;
}) {
  const { run } = useRunAction();
  const [person, setPerson] = useState("");
  const [group, setGroup] = useState<ChannelGroup | "">("");
  const [showStatus, setShowStatus] = useState(true);
  const [editing, setEditing] = useState<ActivityDTO | null>(null);
  const [toDelete, setToDelete] = useState<ActivityDTO | null>(null);

  const list = useMemo(
    () =>
      activities.filter((a) => {
        if (!showStatus && a.kind === "status") return false;
        if (person && a.contactId !== person) return false;
        if (group && (!a.channel || CHANNEL_GROUP[a.channel as Channel] !== group)) return false;
        return true;
      }),
    [activities, person, group, showStatus],
  );

  const groups = Array.from(
    new Set(activities.filter((a) => a.channel).map((a) => CHANNEL_GROUP[a.channel as Channel])),
  );

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <CardTitle>
          <History className="size-4 text-primary" /> Activity timeline
          <span className="text-sm font-normal text-muted-foreground">
            {activities.filter((a) => a.kind !== "status").length}
          </span>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={onNote}>
            Note
          </Button>
          <Button size="sm" onClick={onLog}>
            <Plus /> Log outreach
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {activities.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <SelectField
              value={person}
              onChange={setPerson}
              options={contacts.map((c) => ({ value: c._id, label: c.name }))}
              allowEmpty
              emptyLabel="Everyone"
              placeholder="Everyone"
              size="sm"
              className="w-[160px]"
            />
            <SelectField
              value={group}
              onChange={(v) => setGroup(v as ChannelGroup | "")}
              options={groups.map((g) => ({ value: g, label: CHANNEL_GROUP_LABEL[g] }))}
              allowEmpty
              emptyLabel="All channels"
              placeholder="All channels"
              size="sm"
              className="w-[150px]"
            />
            <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={showStatus}
                onChange={(e) => setShowStatus(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              Show status changes
            </label>
          </div>
        ) : null}

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {activities.length ? "Nothing matches these filters." : "No outreach yet. Every message, email and reply you log shows up here."}
          </div>
        ) : (
          <ol className="relative grid gap-1">
            <span className="absolute top-2 bottom-2 left-[15px] w-px bg-border" aria-hidden />
            {list.map((a) =>
              a.kind === "status" ? (
                <li key={a._id} className="relative flex items-center gap-3 py-1 pl-0 text-xs text-muted-foreground">
                  <span className={cn("z-10 grid size-8 shrink-0 place-items-center rounded-full border-4 border-card", CHANNEL_TINT.status)}>
                    <ChannelIcon channel="status" className="size-3" />
                  </span>
                  <span>
                    Status{" "}
                    <b className="font-medium text-foreground">
                      {COMPANY_STATUS_LABEL[a.fromStatus as CompanyStatus] ?? a.fromStatus} →{" "}
                      {COMPANY_STATUS_LABEL[a.toStatus as CompanyStatus] ?? a.toStatus}
                    </b>
                    {a.summary.includes("(automatic)") ? " · automatic" : ""}
                    {a.summary.includes(" · ") ? ` · ${a.summary.split(" · ").slice(1).join(" · ")}` : ""}
                  </span>
                  <span className="ml-auto whitespace-nowrap">{fmtShort(a.date)}</span>
                </li>
              ) : (
                <li key={a._id} className="relative flex gap-3 rounded-xl py-2 pr-1">
                  <span
                    className={cn(
                      "z-10 grid size-8 shrink-0 place-items-center rounded-full border-4 border-card",
                      CHANNEL_TINT[a.kind === "note" ? "note" : a.channel || "other"],
                    )}
                  >
                    <ChannelIcon channel={a.kind === "note" ? "note" : a.channel} className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium">{ACTIVITY_KIND_LABEL[a.kind as ActivityKind]}</span>
                      {a.channel ? (
                        <span className="text-xs text-muted-foreground">
                          {a.direction === "in" ? "via" : "on"} {CHANNEL_LABEL[a.channel as Channel]}
                        </span>
                      ) : null}
                      {a.contactName ? (
                        <span className="text-xs text-muted-foreground">
                          {a.direction === "in" ? "from" : "→"} <b className="font-medium text-foreground">{a.contactName}</b>
                        </span>
                      ) : null}
                      {a.outcome ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                            <OutcomeBadge outcome={a.outcome} className="cursor-pointer hover:opacity-80" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Update result</DropdownMenuLabel>
                            {OUTCOMES.map((o) => (
                              <DropdownMenuItem
                                key={o.value}
                                onClick={() =>
                                  run(() => setActivityOutcome(a._id, o.value), {
                                    success: `Marked “${o.label}”`,
                                    onSuccess: (d) => {
                                      if (d?.moved) toast.success(`Company moved to ${COMPANY_STATUS_LABEL[d.moved.to]}`);
                                    },
                                  })
                                }
                              >
                                {o.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                    {a.summary ? <p className="mt-0.5 text-sm whitespace-pre-line text-foreground/85">{a.summary}</p> : null}
                    {a.link ? (
                      <a
                        href={toUrl(a.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="size-3 shrink-0" /> {a.link}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs whitespace-nowrap text-muted-foreground" title={fmtDate(a.date)}>
                      {fmtShort(a.date)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs" aria-label="Activity actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(a)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setToDelete(a)}>
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ),
            )}
          </ol>
        )}
      </CardContent>
      {editing ? (
        <EditActivityDialog key={editing._id} activity={editing} contacts={contacts} onClose={() => setEditing(null)} />
      ) : null}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this activity?"
        confirmLabel="Delete"
        onConfirm={() => toDelete && run(() => deleteActivity(toDelete._id), { success: "Deleted" })}
      />
    </Card>
  );
}

function EditActivityDialog({
  activity,
  contacts,
  onClose,
}: {
  activity: ActivityDTO;
  contacts: ContactDTO[];
  onClose: () => void;
}) {
  const { pending, run } = useRunAction();
  const [form, setForm] = useState({
    kind: activity.kind as Exclude<ActivityKind, "status">,
    channel: (activity.channel || "") as Channel | "",
    contactId: activity.contactId ?? "",
    date: toInputDate(activity.date),
    summary: activity.summary,
    link: activity.link,
    outcome: (activity.outcome || "") as Outcome | "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit activity</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateActivity(activity._id, { ...form, contactId: form.contactId || null }), {
              success: "Saved",
              onSuccess: onClose,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <SelectField value={form.kind} onChange={(v) => set("kind", (v || "intro") as typeof form.kind)} options={ACTIVITY_KINDS} />
            </Field>
            <Field label="Channel">
              <SelectField value={form.channel} onChange={(v) => set("channel", v as Channel | "")} options={CHANNELS} allowEmpty emptyLabel="—" placeholder="—" />
            </Field>
            <Field label="Person">
              <SelectField
                value={form.contactId}
                onChange={(v) => set("contactId", v)}
                options={contacts.map((c) => ({ value: c._id, label: c.name }))}
                allowEmpty
                emptyLabel="Company"
                placeholder="Company"
              />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
          </div>
          <Field label="Summary">
            <Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={3} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link">
              <Input value={form.link} onChange={(e) => set("link", e.target.value)} />
            </Field>
            <Field label="Result">
              <SelectField value={form.outcome} onChange={(v) => set("outcome", v as Outcome | "")} options={OUTCOMES} allowEmpty emptyLabel="—" placeholder="—" />
            </Field>
          </div>
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
