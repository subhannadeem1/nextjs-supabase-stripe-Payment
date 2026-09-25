import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";

export type DateLike = string | Date | null | undefined;

export function toDate(d: DateLike): Date | null {
  if (!d) return null;
  const date = typeof d === "string" ? parseISO(d) : d;
  return isValid(date) ? date : null;
}

export function fmtDate(d: DateLike, pattern = "d MMM yyyy") {
  const date = toDate(d);
  return date ? format(date, pattern) : "—";
}

export function fmtShort(d: DateLike) {
  const date = toDate(d);
  if (!date) return "—";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return format(date, sameYear ? "d MMM" : "d MMM yy");
}

/** "today", "yesterday", "3 days ago", "in 2 days" */
export function relativeDay(d: DateLike) {
  const date = toDate(d);
  if (!date) return "—";
  const diff = differenceInCalendarDays(date, new Date());
  if (diff === 0) return "today";
  if (diff === -1) return "yesterday";
  if (diff === 1) return "tomorrow";
  if (diff < 0 && diff > -7) return `${-diff} days ago`;
  if (diff > 0 && diff < 7) return `in ${diff} days`;
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function daysFromToday(d: DateLike) {
  const date = toDate(d);
  if (!date) return null;
  return differenceInCalendarDays(date, new Date());
}

/** yyyy-MM-dd for <input type="date"> */
export function toInputDate(d: DateLike) {
  const date = toDate(d);
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function todayInput() {
  return format(new Date(), "yyyy-MM-dd");
}

export function inputDatePlus(days: number) {
  return format(addDays(startOfDay(new Date()), days), "yyyy-MM-dd");
}

/** Parse a yyyy-MM-dd string as a local-noon date so timezones never shift the day. */
export function fromInputDate(value?: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

/** "2026-09" for a date */
export function periodOf(d: Date) {
  return format(d, "yyyy-MM");
}

export function periodLabel(period: string, pattern = "MMM yy") {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  return format(new Date(y, m - 1, 1), pattern);
}

/** Inclusive list of yyyy-MM periods between two dates. */
export function periodsBetween(from: Date, to: Date) {
  const out: string[] = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur <= end && out.length < 600) {
    out.push(periodOf(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

export function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
