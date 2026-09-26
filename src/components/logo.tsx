import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-brand",
        className,
      )}
    >
      <Zap className="size-[55%]" strokeWidth={2.4} />
    </span>
  );
}

export function Logo({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[15px] font-semibold tracking-tight">{name}</div>
        {subtitle ? <div className="truncate text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
    </div>
  );
}
