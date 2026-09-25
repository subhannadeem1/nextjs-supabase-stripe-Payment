"use client";

import { Mail, MessageSquareText, MoreHorizontal, Pencil, Phone, Plus, Send, Star, Trash2, Users } from "lucide-react";

import { deleteContact } from "@/actions/companies";
import { OutcomeBadge } from "@/components/badges";
import { PersonAvatar } from "@/components/company-logo";
import { ConfirmDialog } from "@/components/confirm";
import { ChannelIcon, CHANNEL_TINT, LinkedInIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CHANNEL_GROUP, CHANNEL_GROUP_LABEL, SENIORITY_LABEL, type Channel, type ChannelGroup } from "@/lib/constants";
import { fmtShort } from "@/lib/dates";
import { toUrl } from "@/lib/normalize";
import type { ActivityDTO, ContactDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";
import { useState } from "react";

/** Latest touch per channel group for one person. */
function channelSummary(contactId: string, activities: ActivityDTO[]) {
  const map = new Map<ChannelGroup, ActivityDTO & { count: number }>();
  for (const a of activities) {
    if (a.contactId !== contactId || !a.channel || a.kind === "status" || a.kind === "note") continue;
    const g = CHANNEL_GROUP[a.channel as Channel];
    const prev = map.get(g);
    if (!prev) map.set(g, { ...a, count: 1 });
    else prev.count += 1; // activities are newest-first, keep the first
  }
  return [...map.entries()];
}

export function PeopleCard({
  companyId,
  contacts,
  activities,
  onAdd,
  onEdit,
  onLog,
  onTemplate,
}: {
  companyId: string;
  contacts: ContactDTO[];
  activities: ActivityDTO[];
  onAdd: () => void;
  onEdit: (c: ContactDTO) => void;
  onLog: (contactId: string) => void;
  onTemplate: (contactId: string) => void;
}) {
  const { run } = useRunAction();
  const [toDelete, setToDelete] = useState<ContactDTO | null>(null);
  const sorted = [...contacts].sort((a, b) => Number(b.decisionMaker) - Number(a.decisionMaker));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Users className="size-4 text-primary" /> People
          <span className="text-sm font-normal text-muted-foreground">{contacts.length}</span>
        </CardTitle>
        <Button size="sm" variant="soft" onClick={onAdd}>
          <Plus /> Add person
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {contacts.length === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors hover:bg-accent/40"
          >
            No one saved yet. Add the founder, CEO or director you plan to approach.
          </button>
        ) : (
          sorted.map((c) => {
            const touches = channelSummary(c._id, activities);
            return (
              <div key={c._id} className="rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30">
                <div className="flex items-start gap-3">
                  <PersonAvatar name={c.name} className="mt-0.5 size-9" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium">{c.name}</span>
                      {c.decisionMaker ? (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/14 px-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                          <Star className="size-3 fill-current" /> Decision-maker
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[c.role, c.seniority ? SENIORITY_LABEL[c.seniority] : ""].filter(Boolean).join(" · ") || "Role not set"}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {c.linkedin ? (
                      <IconLink href={toUrl(c.linkedin)} label="Open LinkedIn">
                        <LinkedInIcon className="size-4 text-[#0a66c2] dark:text-[#5aa9ff]" />
                      </IconLink>
                    ) : null}
                    {c.email ? (
                      <IconLink href={`mailto:${c.email}`} label={c.email}>
                        <Mail className="size-4" />
                      </IconLink>
                    ) : null}
                    {c.phone ? (
                      <IconLink href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}`} label={`WhatsApp ${c.phone}`}>
                        <Phone className="size-4" />
                      </IconLink>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Person actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onLog(c._id)}>
                          <Send /> Log outreach
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTemplate(c._id)}>
                          <MessageSquareText /> Use template
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(c)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setToDelete(c)}>
                          <Trash2 /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-12">
                  {touches.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => onLog(c._id)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Not approached yet — log first message
                    </button>
                  ) : (
                    touches.map(([group, a]) => (
                      <span
                        key={group}
                        className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 py-0.5 pr-1 pl-1.5 text-xs"
                        title={a.summary}
                      >
                        <span className={cn("grid size-5 place-items-center rounded-md", CHANNEL_TINT[a.channel] ?? CHANNEL_TINT.other)}>
                          <ChannelIcon channel={a.channel} className="size-3" />
                        </span>
                        <span className="font-medium">{CHANNEL_GROUP_LABEL[group]}</span>
                        <span className="text-muted-foreground">{fmtShort(a.date)}</span>
                        {a.count > 1 ? <span className="text-muted-foreground">×{a.count}</span> : null}
                        <OutcomeBadge outcome={a.outcome} className="py-0 text-[11px]" />
                      </span>
                    ))
                  )}
                </div>
                {c.notes ? <p className="mt-2 pl-12 text-xs whitespace-pre-line text-muted-foreground">{c.notes}</p> : null}
              </div>
            );
          })
        )}
      </CardContent>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Remove ${toDelete?.name}?`}
        description="Their outreach history stays in the timeline."
        confirmLabel="Remove"
        onConfirm={() => toDelete && run(() => deleteContact(companyId, toDelete._id), { success: "Person removed" })}
      />
    </Card>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label={label}
        >
          {children}
        </a>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
