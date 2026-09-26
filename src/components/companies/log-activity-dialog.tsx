"use client";

import { useMemo, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { logActivity } from "@/actions/activities";
import { OutcomeBadge } from "@/components/badges";
import { ChannelIcon } from "@/components/icons";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ACTIVITY_KINDS,
  CHANNEL_GROUP,
  CHANNEL_LABEL,
  CHANNELS,
  COMPANY_STATUS_LABEL,
  FOLLOW_UP_PRESETS,
  OUTCOMES,
  type ActivityKind,
  type Channel,
  type Outcome,
} from "@/lib/constants";
import { fmtShort, inputDatePlus, todayInput } from "@/lib/dates";
import type { ActivityDTO, ContactDTO, DemoDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

export type LogPreset = {
  contactId?: string;
  channel?: Channel;
  kind?: Exclude<ActivityKind, "status">;
  summary?: string;
  link?: string;
  templateId?: string;
};

type LoggableKind = Exclude<ActivityKind, "status">;
const COMPANY_WIDE = "__company__";

export function LogActivityDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  contacts,
  activities,
  demos,
  defaultFollowUpDays,
  preset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  companyName: string;
  contacts: ContactDTO[];
  activities: ActivityDTO[];
  demos: DemoDTO[];
  defaultFollowUpDays: number;
  preset?: LogPreset;
}) {
  const { pending, run } = useRunAction();
  const initialKind: LoggableKind = preset?.kind ?? "intro";
  const [contactId, setContactId] = useState(preset?.contactId ?? contacts.find((c) => c.decisionMaker)?._id ?? contacts[0]?._id ?? COMPANY_WIDE);
  const [kind, setKind] = useState<LoggableKind>(initialKind);
  const [channel, setChannel] = useState<Channel>(preset?.channel ?? "linkedin_message");
  const [date, setDate] = useState(todayInput());
  const [summary, setSummary] = useState(preset?.summary ?? "");
  const [link, setLink] = useState(preset?.link ?? "");
  const [demoId, setDemoId] = useState("");
  const [outcome, setOutcome] = useState<Outcome | "">(initialKind === "reply" ? "replied" : "pending");
  const outboundDefault = defaultFollowUpDays > 0 ? inputDatePlus(defaultFollowUpDays) : "";
  const [followMode, setFollowMode] = useState<"keep" | "none" | "date">(
    ["intro", "proposal", "demo", "follow_up"].includes(initialKind) && outboundDefault ? "date" : "keep",
  );
  const [followDate, setFollowDate] = useState(outboundDefault);
  const [followNote, setFollowNote] = useState("");

  const isNote = kind === "note";

  const changeKind = (k: LoggableKind) => {
    setKind(k);
    if (k === "reply") {
      setOutcome("replied");
      setFollowMode("keep");
    } else if (k === "meeting") {
      setOutcome("meeting");
      setChannel("meeting");
    } else if (k === "note") {
      setOutcome("");
      setFollowMode("keep");
    } else {
      setOutcome((o) => (o === "" || o === "replied" ? "pending" : o));
      if (outboundDefault && followMode === "keep") {
        setFollowMode("date");
        setFollowDate(outboundDefault);
      }
    }
  };

  // Have we already approached this person on this channel?
  const previous = useMemo(() => {
    if (isNote) return [];
    const group = CHANNEL_GROUP[channel];
    return activities.filter(
      (a) =>
        a.kind !== "status" &&
        a.kind !== "note" &&
        a.direction === "out" &&
        a.channel &&
        CHANNEL_GROUP[a.channel as Channel] === group &&
        (contactId === COMPANY_WIDE ? !a.contactId : a.contactId === contactId),
    );
  }, [activities, channel, contactId, isNote]);

  const submit = () => {
    const payload = {
      companyId,
      contactId: contactId === COMPANY_WIDE ? null : contactId,
      channel: isNote ? ("" as const) : channel,
      kind,
      date,
      summary,
      link,
      outcome: isNote ? ("" as const) : outcome,
      demoId: kind === "demo" && demoId ? demoId : null,
      templateId: preset?.templateId ?? null,
      followUpDate: followMode === "keep" ? undefined : followMode === "none" ? "" : followDate,
      followUpNote: followMode === "date" ? followNote : undefined,
    };
    run(() => logActivity(payload), {
      success: isNote ? "Note saved" : "Outreach logged",
      onSuccess: (data) => {
        if (data?.moved) toast.success(`${companyName} moved to ${COMPANY_STATUS_LABEL[data.moved.to]}`);
        onOpenChange(false);
      },
    });
  };

  const person = contacts.find((c) => c._id === contactId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNote ? "Add note" : "Log outreach"}</DialogTitle>
          <DialogDescription>{companyName}</DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="What happened?">
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => changeKind(k.value)}
                  className={cn(
                    "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors",
                    kind === k.value
                      ? "border-transparent bg-brand text-white shadow-brand"
                      : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_170px]">
            <Field label="Person">
              <SelectField
                value={contactId}
                onChange={(v) => setContactId(v || COMPANY_WIDE)}
                options={[
                  ...contacts.map((c) => ({ value: c._id, label: c.role ? `${c.name} · ${c.role}` : c.name })),
                  { value: COMPANY_WIDE, label: "Company (no specific person)" },
                ]}
              />
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={inputDatePlus(1)} />
            </Field>
          </div>

          {!isNote ? (
            <Field label="Channel">
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChannel(c.value)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] transition-colors",
                      channel === c.value
                        ? "border-primary/60 bg-accent font-medium text-accent-foreground"
                        : "bg-card text-muted-foreground hover:bg-accent/60",
                    )}
                  >
                    <ChannelIcon channel={c.value} className="size-3.5" />
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}

          {previous.length ? (
            <div className="flex gap-2 rounded-xl border border-warning/30 bg-warning/8 p-3 text-sm">
              <History className="mt-0.5 size-4 shrink-0 text-warning" />
              <div className="grid gap-1">
                <span className="font-medium">
                  Already approached {person ? person.name : "the company"} on {CHANNEL_LABEL[channel].split(" ")[0]}{" "}
                  {previous.length === 1 ? "once" : `${previous.length} times`}
                </span>
                {previous.slice(0, 3).map((a) => (
                  <span key={a._id} className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {fmtShort(a.date)} · {a.channel ? CHANNEL_LABEL[a.channel as Channel] : ""}
                    {a.summary ? ` · ${a.summary.slice(0, 60)}` : ""}
                    <OutcomeBadge outcome={a.outcome} />
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {kind === "demo" && demos.length ? (
            <Field label="Which demo?">
              <SelectField
                value={demoId}
                onChange={(v) => {
                  setDemoId(v);
                  const d = demos.find((x) => x._id === v);
                  if (d) {
                    setLink(d.url);
                    if (!summary) setSummary(`Sent ${d.title}`);
                  }
                }}
                options={demos.map((d) => ({ value: d._id, label: d.title }))}
                allowEmpty
                emptyLabel="Not from library"
                placeholder="Pick from demo library"
              />
            </Field>
          ) : null}

          <Field label={isNote ? "Note" : "Summary"}>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={isNote ? "Anything worth remembering…" : "What did you send / what did they say?"}
              rows={3}
            />
          </Field>

          {!isNote ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link (optional)">
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Demo, email thread, post…" />
              </Field>
              <Field label="Result">
                <SelectField value={outcome} onChange={(v) => setOutcome(v as Outcome | "")} options={OUTCOMES} />
              </Field>
            </div>
          ) : null}

          <div className="grid gap-2 rounded-xl border bg-muted/30 p-3">
            <span className="text-[13px] font-medium">Next follow-up</span>
            <div className="flex flex-wrap gap-1.5">
              <Chip on={followMode === "keep"} onClick={() => setFollowMode("keep")}>
                Don’t change
              </Chip>
              <Chip on={followMode === "none"} onClick={() => setFollowMode("none")}>
                No follow-up
              </Chip>
              {FOLLOW_UP_PRESETS.map((p) => {
                const d = inputDatePlus(p.days);
                return (
                  <Chip
                    key={p.days}
                    on={followMode === "date" && followDate === d}
                    onClick={() => {
                      setFollowMode("date");
                      setFollowDate(d);
                    }}
                  >
                    {p.label}
                  </Chip>
                );
              })}
              <Input
                type="date"
                value={followMode === "date" ? followDate : ""}
                onChange={(e) => {
                  setFollowMode(e.target.value ? "date" : "none");
                  setFollowDate(e.target.value);
                }}
                className="h-8 w-[150px]"
                aria-label="Custom follow-up date"
              />
            </div>
            {followMode === "date" ? (
              <Input
                value={followNote}
                onChange={(e) => setFollowNote(e.target.value)}
                placeholder="What to do then? e.g. send 3D demo reminder"
                className="h-8"
              />
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {isNote ? "Save note" : "Log it"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg border px-2.5 text-[13px] transition-colors",
        on ? "border-primary/60 bg-accent font-medium text-accent-foreground" : "bg-card text-muted-foreground hover:bg-accent/60",
      )}
    >
      {children}
    </button>
  );
}
