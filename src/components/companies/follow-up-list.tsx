"use client";

import Link from "next/link";
import { AlarmClock, Check, ChevronRight, Clock, UserRound } from "lucide-react";

import { setFollowUp, snoozeFollowUp } from "@/actions/companies";
import { StatusBadge } from "@/components/badges";
import { CompanyLogo } from "@/components/company-logo";
import { RelTime } from "@/components/rel-time";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { flagEmoji } from "@/lib/countries";
import type { CompanyRow } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

import { FollowUpCell } from "./company-cells";

export function FollowUpList({
  rows,
  empty,
  showLastContact,
}: {
  rows: CompanyRow[];
  empty?: React.ReactNode;
  showLastContact?: boolean;
}) {
  const { pending, run } = useRunAction();
  if (rows.length === 0) return <>{empty ?? null}</>;
  return (
    <ul className="grid gap-2">
      {rows.map((c) => {
        const person = c.contacts.find((p) => p.decisionMaker) ?? c.contacts[0];
        return (
          <li key={c._id} className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30">
            <CompanyLogo name={c.name} domain={c.domain} className="size-9" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link href={`/marketing/companies/${c._id}`} className="truncate font-medium hover:text-primary">
                  {c.name}
                </Link>
                {c.country ? <span className="text-sm">{flagEmoji(c.country)}</span> : null}
                <StatusBadge status={c.status} />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {c.followUpNote ? <span className="text-foreground/80">{c.followUpNote}</span> : null}
                {person ? (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3" /> {person.name}
                  </span>
                ) : null}
                {showLastContact || !c.followUpAt ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> last contact <RelTime date={c.lastContactedAt} />
                  </span>
                ) : null}
              </div>
            </div>
            {c.followUpAt ? <FollowUpCell date={c.followUpAt} /> : null}
            <div className="flex items-center gap-1">
              {c.followUpAt ? (
                <>
                  <Button
                    size="icon-sm"
                    variant="soft"
                    disabled={pending}
                    title="Mark done"
                    onClick={() => run(() => setFollowUp(c._id, null), { success: `${c.name}: follow-up done` })}
                  >
                    <Check />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon-sm" variant="outline" title="Snooze" disabled={pending}>
                        <AlarmClock />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Snooze</DropdownMenuLabel>
                      {[1, 3, 7, 14].map((d) => (
                        <DropdownMenuItem
                          key={d}
                          onClick={() => run(() => snoozeFollowUp(c._id, d), { success: `Snoozed ${d} day${d > 1 ? "s" : ""}` })}
                        >
                          +{d} day{d > 1 ? "s" : ""}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : null}
              <Button size="icon-sm" variant="ghost" asChild>
                <Link href={`/marketing/companies/${c._id}`} aria-label={`Open ${c.name}`}>
                  <ChevronRight />
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function FollowUpGroup({
  title,
  tone,
  rows,
  showLastContact,
}: {
  title: string;
  tone?: "danger" | "warning" | "default";
  rows: CompanyRow[];
  showLastContact?: boolean;
}) {
  if (!rows.length) return null;
  return (
    <section className="grid gap-2">
      <h2
        className={cn(
          "flex items-center gap-2 text-sm font-semibold",
          tone === "danger" && "text-destructive",
          tone === "warning" && "text-warning",
        )}
      >
        {title}
        <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">{rows.length}</span>
      </h2>
      <FollowUpList rows={rows} showLastContact={showLastContact} />
    </section>
  );
}
