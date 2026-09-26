"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** Long text collapsed to a few lines with a "Show more" toggle. */
export function ClampText({ text, className, lines = 4 }: { text: string; className?: string; lines?: 3 | 4 | 6 }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 240 || text.split("\n").length > lines;
  const clamp = { 3: "line-clamp-3", 4: "line-clamp-4", 6: "line-clamp-6" }[lines];
  return (
    <div className={className}>
      <p className={cn("whitespace-pre-line", long && !open && clamp)}>{text}</p>
      {long ? (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-0.5 text-xs font-medium text-primary hover:underline">
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
