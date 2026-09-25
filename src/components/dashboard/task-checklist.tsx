"use client";

import Link from "next/link";

import { toggleTask } from "@/actions/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { daysFromToday, relativeDay } from "@/lib/dates";
import type { TaskDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

export function TaskChecklist({ tasks }: { tasks: TaskDTO[] }) {
  const { run } = useRunAction();
  return (
    <ul className="grid gap-1.5">
      {tasks.map((t) => {
        const diff = daysFromToday(t.dueDate);
        return (
          <li key={t._id} className="flex items-start gap-2.5 rounded-lg px-1 py-1 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={t.done}
              onCheckedChange={(v) => run(() => toggleTask(t._id, v === true), { success: v ? "Task done ✓" : undefined })}
            />
            <div className="min-w-0 flex-1">
              <div className={cn(t.done && "text-muted-foreground line-through")}>{t.title}</div>
              {t.company || t.project ? (
                <div className="truncate text-xs text-muted-foreground">
                  {t.project ? (
                    <Link href={`/projects/${t.project._id}`} className="hover:text-primary">
                      {t.project.title}
                    </Link>
                  ) : t.company ? (
                    <Link href={`/marketing/companies/${t.company._id}`} className="hover:text-primary">
                      {t.company.name}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
            {t.dueDate ? (
              <span
                suppressHydrationWarning
                className={cn(
                  "shrink-0 text-xs",
                  diff !== null && diff < 0 ? "font-medium text-destructive" : diff === 0 ? "font-medium text-warning" : "text-muted-foreground",
                )}
              >
                {relativeDay(t.dueDate)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
