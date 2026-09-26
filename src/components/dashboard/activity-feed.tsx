import Link from "next/link";

import { OutcomeBadge } from "@/components/badges";
import { ChannelIcon, CHANNEL_TINT } from "@/components/icons";
import { ACTIVITY_KIND_LABEL, CHANNEL_LABEL, type ActivityKind, type Channel } from "@/lib/constants";
import { fmtShort } from "@/lib/dates";
import type { ActivityDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ActivityFeed({ activities }: { activities: ActivityDTO[] }) {
  if (!activities.length) return <p className="text-sm text-muted-foreground">Nothing logged yet.</p>;
  return (
    <ul className="grid gap-3">
      {activities.map((a) => (
        <li key={a._id} className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full",
              CHANNEL_TINT[a.kind === "note" ? "note" : a.channel || "other"],
            )}
          >
            <ChannelIcon channel={a.kind === "note" ? "note" : a.channel} className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
              {a.company ? (
                <Link href={`/marketing/companies/${a.company._id}`} className="font-medium hover:text-primary">
                  {a.company.name}
                </Link>
              ) : null}
              <span className="text-muted-foreground">
                · {ACTIVITY_KIND_LABEL[a.kind as ActivityKind]}
                {a.channel ? ` on ${CHANNEL_LABEL[a.channel as Channel]}` : ""}
                {a.contactName ? ` · ${a.contactName}` : ""}
              </span>
              <OutcomeBadge outcome={a.outcome} />
            </div>
            {a.summary ? <p className="truncate text-xs text-muted-foreground">{a.summary}</p> : null}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{fmtShort(a.date)}</span>
        </li>
      ))}
    </ul>
  );
}
