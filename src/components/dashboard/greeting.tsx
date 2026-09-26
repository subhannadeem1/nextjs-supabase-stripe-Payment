"use client";

import { format } from "date-fns";

export function Greeting({ name }: { name: string }) {
  const h = new Date().getHours();
  const part = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <div>
      <p suppressHydrationWarning className="text-sm text-muted-foreground">
        {format(new Date(), "EEEE, d MMMM")}
      </p>
      <h1 suppressHydrationWarning className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">
        {part}
        {name ? `, ${name.split(" ")[0]}` : ""} <span className="text-brand">👋</span>
      </h1>
    </div>
  );
}
