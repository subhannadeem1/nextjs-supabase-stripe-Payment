"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/types";

/** Run a server action inside a transition and toast the result. */
export function useRunAction() {
  const [pending, startTransition] = useTransition();
  const run = useCallback(
    <T,>(
      fn: () => Promise<ActionResult<T>>,
      opts?: { success?: string; onSuccess?: (data: T) => void; onError?: (error: string) => void },
    ) => {
      startTransition(async () => {
        const res = await fn();
        if (res.ok) {
          if (opts?.success) toast.success(opts.success);
          opts?.onSuccess?.(res.data as T);
        } else {
          toast.error(res.error);
          opts?.onError?.(res.error);
        }
      });
    },
    [],
  );
  return { pending, run };
}
