"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Users } from "lucide-react";

import { setCompanyStatus } from "@/actions/companies";
import { PriorityBadge } from "@/components/badges";
import { CompanyLogo } from "@/components/company-logo";
import { COMPANY_STATUSES, STATUS_STYLE, type CompanyStatus } from "@/lib/constants";
import { flagEmoji } from "@/lib/countries";
import type { CompanyRow } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

import { FollowUpCell } from "./company-cells";

export function CompaniesBoard({ rows }: { rows: CompanyRow[] }) {
  // Optimistic status while the server catches up.
  const [overrides, setOverrides] = useState<Record<string, CompanyStatus>>({});
  const { run } = useRunAction();
  const items = rows.map((r) => (overrides[r._id] ? { ...r, status: overrides[r._id] } : r));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const to = e.over?.id as CompanyStatus | undefined;
    const card = items.find((c) => c._id === id);
    if (!card || !to || card.status === to) return;
    setOverrides((o) => ({ ...o, [id]: to }));
    run(() => setCompanyStatus(id, to), {
      success: `${card.name} → ${COMPANY_STATUSES.find((s) => s.value === to)?.label}`,
      onError: () =>
        setOverrides((o) => {
          const next = { ...o };
          delete next[id];
          return next;
        }),
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-thin sm:mx-0 sm:px-0">
        <div className="flex w-max gap-3">
          {COMPANY_STATUSES.map((s) => (
            <Column
              key={s.value}
              status={s.value}
              label={s.label}
              cards={items.filter((c) => c.status === s.value)}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function Column({ status, label, cards }: { status: CompanyStatus; label: string; cards: CompanyRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[260px] shrink-0 flex-col rounded-xl border bg-muted/35 transition-colors",
        isOver && "border-primary/50 bg-accent/60",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn("size-2 rounded-full", STATUS_STYLE[status].dot)} />
        <span className="text-[13px] font-semibold">{label}</span>
        <span className="ml-auto rounded-full bg-card px-2 text-xs text-muted-foreground tabular-nums">{cards.length}</span>
      </div>
      <div className="flex min-h-24 flex-col gap-2 px-2 pb-2">
        {cards.map((c) => (
          <Card key={c._id} c={c} />
        ))}
        {cards.length === 0 ? (
          <div className="grid h-16 place-items-center rounded-lg border border-dashed text-xs text-muted-foreground/70">
            Drop here
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Card({ c }: { c: CompanyRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: c._id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab touch-none rounded-lg border bg-card p-2.5 shadow-xs transition-shadow active:cursor-grabbing",
        isDragging && "z-50 shadow-xl ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-center gap-2">
        <CompanyLogo name={c.name} domain={c.domain} className="size-7" />
        <Link
          href={`/marketing/companies/${c._id}`}
          className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {c.name}
        </Link>
        <PriorityBadge priority={c.priority} className="size-5 text-[10px]" />
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {c.country ? <span>{flagEmoji(c.country)}</span> : null}
        {c.contacts.length ? (
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" /> {c.contacts.length}
          </span>
        ) : null}
        <span className="ml-auto">
          <FollowUpCell date={c.followUpAt} compact />
        </span>
      </div>
    </div>
  );
}
