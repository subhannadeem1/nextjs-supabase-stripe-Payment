import {
  COMPANY_STATUS_LABEL,
  INVOICE_STATUS_STYLE,
  OUTCOME_LABEL,
  OUTCOME_STYLE,
  PRIORITY_STYLE,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_STYLE,
  STATUS_STYLE,
  type CompanyStatus,
  type InvoiceStatus,
  type Outcome,
  type Priority,
  type ProjectStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const pill = "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium";

export function StatusBadge({ status, className }: { status: CompanyStatus; className?: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.researching;
  return (
    <span className={cn(pill, s.pill, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {COMPANY_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority | ""; className?: string }) {
  if (!priority) return <span className="text-muted-foreground/60">—</span>;
  return (
    <span
      className={cn(
        "inline-grid size-6 place-items-center rounded-md text-xs font-bold",
        PRIORITY_STYLE[priority],
        className,
      )}
      title={`Priority ${priority}`}
    >
      {priority}
    </span>
  );
}

export function OutcomeBadge({ outcome, className }: { outcome: Outcome | ""; className?: string }) {
  if (!outcome) return null;
  return <span className={cn(pill, OUTCOME_STYLE[outcome], className)}>{OUTCOME_LABEL[outcome]}</span>;
}

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span className={cn(pill, PROJECT_STATUS_STYLE[status], className)}>{PROJECT_STATUS_LABEL[status]}</span>
  );
}

export function InvoiceStatusBadge({
  status,
  overdue,
  className,
}: {
  status: InvoiceStatus;
  overdue?: boolean;
  className?: string;
}) {
  const key = overdue && status === "sent" ? "overdue" : status;
  const label = key === "overdue" ? "Overdue" : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={cn(pill, INVOICE_STATUS_STYLE[key], className)}>{label}</span>;
}
