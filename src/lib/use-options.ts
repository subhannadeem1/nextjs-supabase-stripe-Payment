"use client";

import { useEffect, useState } from "react";

import type { ActionResult } from "@/lib/types";

/** Load picker options from a server action the first time a dialog opens. */
export function useOptions<T>(fetcher: () => Promise<ActionResult<T[]>>, enabled: boolean) {
  const [data, setData] = useState<T[] | null>(null);
  useEffect(() => {
    if (!enabled || data) return;
    let alive = true;
    fetcher().then((res) => {
      if (alive && res.ok) setData(res.data as T[]);
    });
    return () => {
      alive = false;
    };
  }, [enabled, data, fetcher]);
  return { options: data ?? [], loading: enabled && !data };
}
