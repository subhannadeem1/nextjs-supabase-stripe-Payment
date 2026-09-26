import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  tone?: "default" | "brand" | "danger" | "success" | "warning";
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border bg-card p-4 transition-shadow",
        href && "hover:shadow-md",
        tone === "brand" && "border-transparent bg-brand text-white shadow-brand",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "text-[13px] font-medium text-muted-foreground",
            tone === "brand" && "text-white/85",
          )}
        >
          {label}
        </div>
        {Icon ? (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground",
              tone === "brand" && "bg-white/20 text-white",
              tone === "danger" && "bg-destructive/12 text-destructive",
              tone === "success" && "bg-success/12 text-success",
              tone === "warning" && "bg-warning/14 text-warning",
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint ? (
        <div className={cn("mt-1 text-xs text-muted-foreground", tone === "brand" && "text-white/80")}>
          {hint}
        </div>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
