import Link from "next/link";

import { COMPANY_STATUSES, STATUS_STYLE, type CompanyStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Horizontal bars — one per pipeline stage. */
export function PipelineBars({ counts }: { counts: Record<CompanyStatus, number> }) {
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="grid gap-2">
      {COMPANY_STATUSES.map((s) => (
        <Link
          key={s.value}
          href={`/marketing/companies`}
          className="group grid grid-cols-[110px_1fr_32px] items-center gap-3 text-sm"
        >
          <span className="truncate text-muted-foreground group-hover:text-foreground">{s.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className={cn("block h-full rounded-full", STATUS_STYLE[s.value].dot)}
              style={{ width: `${(counts[s.value] / max) * 100}%` }}
            />
          </span>
          <span className="text-right text-xs font-medium tabular-nums">{counts[s.value]}</span>
        </Link>
      ))}
    </div>
  );
}
