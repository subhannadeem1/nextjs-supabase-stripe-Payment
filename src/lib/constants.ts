/**
 * All option lists used across the app live here so labels, order and
 * colours stay consistent between tables, forms, badges and charts.
 */

type Option<V extends string = string> = { value: V; label: string };

function labelsOf<V extends string>(options: readonly Option<V>[]) {
  return Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<V, string>;
}

/* ------------------------------ Companies ------------------------------ */

export const COMPANY_STATUSES = [
  { value: "researching", label: "Researching", hint: "Found it, still checking" },
  { value: "ready", label: "Ready to contact", hint: "Research done, decision-maker found" },
  { value: "contacted", label: "Contacted", hint: "First message / email sent" },
  { value: "replied", label: "Replied", hint: "They answered" },
  { value: "interested", label: "Interested", hint: "Demo / meeting in progress" },
  { value: "proposal", label: "Proposal sent", hint: "Price or proposal shared" },
  { value: "won", label: "Won · Client", hint: "Deal closed" },
  { value: "lost", label: "Lost", hint: "They said no" },
  { value: "not_fit", label: "Not a fit", hint: "Skipped after research" },
] as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[number]["value"];
export const COMPANY_STATUS_VALUES = COMPANY_STATUSES.map((s) => s.value) as [
  CompanyStatus,
  ...CompanyStatus[],
];
export const COMPANY_STATUS_LABEL = labelsOf(COMPANY_STATUSES);

/** Pipeline order used for "forward only" automatic status changes. */
export const STATUS_RANK: Record<CompanyStatus, number> = {
  researching: 0,
  ready: 1,
  contacted: 2,
  replied: 3,
  interested: 4,
  proposal: 5,
  won: 6,
  lost: 99,
  not_fit: 99,
};

/** Tailwind classes for status pills (light + dark). */
export const STATUS_STYLE: Record<CompanyStatus, { pill: string; dot: string }> = {
  researching: { pill: "bg-slate-500/10 text-slate-700 dark:text-slate-300", dot: "bg-slate-400" },
  ready: { pill: "bg-sky-500/12 text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  contacted: { pill: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500" },
  replied: { pill: "bg-violet-500/12 text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  interested: { pill: "bg-amber-500/14 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  proposal: { pill: "bg-orange-500/14 text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  won: { pill: "bg-emerald-500/14 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  lost: { pill: "bg-rose-500/12 text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
  not_fit: { pill: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" },
};

export const PRIORITIES = [
  { value: "A", label: "A · High" },
  { value: "B", label: "B · Medium" },
  { value: "C", label: "C · Low" },
] as const;
export type Priority = (typeof PRIORITIES)[number]["value"];
export const PRIORITY_STYLE: Record<Priority, string> = {
  A: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  B: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  C: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

export const COMPANY_TYPES = [
  { value: "manufacturer", label: "Manufacturer" },
  { value: "distributor", label: "Distributor / Wholesaler" },
  { value: "installer", label: "Installer / EPC" },
  { value: "developer", label: "Developer / IPP" },
  { value: "software", label: "Software / Tech" },
  { value: "other", label: "Other" },
] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number]["value"];
export const COMPANY_TYPE_LABEL = labelsOf(COMPANY_TYPES);

export const SEGMENTS = [
  "Pitched roof",
  "Flat roof",
  "Ground mount",
  "Carport",
  "Tracker",
  "Floating",
  "Balcony / Plug-in",
  "Façade / BIPV",
] as const;

export const OPPORTUNITIES = [
  "3D Configurator",
  "2D Configurator",
  "OMS",
  "Quote / BOM tool",
  "Website",
  "Mobile app",
  "Custom software",
] as const;

export const CONFIGURATOR_EXISTS = [
  { value: "unknown", label: "Not checked" },
  { value: "yes", label: "Has configurator" },
  { value: "no", label: "No configurator" },
] as const;
export type ConfiguratorExists = (typeof CONFIGURATOR_EXISTS)[number]["value"];

export const CONFIGURATOR_KINDS = ["2D", "3D", "2D + 3D", "Form / calculator", "Other"] as const;

export const RESEARCH_STEPS = [
  { key: "website", label: "Website reviewed" },
  { key: "configurator", label: "Configurator checked" },
  { key: "decisionMaker", label: "Decision-maker found" },
  { key: "contactInfo", label: "Contact info found" },
] as const;
export type ResearchKey = (typeof RESEARCH_STEPS)[number]["key"];

export const SENIORITY = [
  { value: "founder", label: "Founder / Owner" },
  { value: "c_level", label: "C-level" },
  { value: "director", label: "Director / Head" },
  { value: "manager", label: "Manager" },
  { value: "other", label: "Other" },
] as const;
export type Seniority = (typeof SENIORITY)[number]["value"];
export const SENIORITY_LABEL = labelsOf(SENIORITY);

/* ------------------------------ Outreach ------------------------------ */

export const CHANNELS = [
  { value: "linkedin_connect", label: "LinkedIn connect", group: "linkedin" },
  { value: "linkedin_message", label: "LinkedIn message", group: "linkedin" },
  { value: "email", label: "Email", group: "email" },
  { value: "whatsapp", label: "WhatsApp", group: "whatsapp" },
  { value: "call", label: "Phone call", group: "call" },
  { value: "contact_form", label: "Website form", group: "other" },
  { value: "meeting", label: "Meeting / video call", group: "meeting" },
  { value: "other", label: "Other", group: "other" },
] as const;
export type Channel = (typeof CHANNELS)[number]["value"];
export type ChannelGroup = (typeof CHANNELS)[number]["group"];
export const CHANNEL_VALUES = CHANNELS.map((c) => c.value) as [Channel, ...Channel[]];
export const CHANNEL_LABEL = labelsOf(CHANNELS);
export const CHANNEL_GROUP: Record<Channel, ChannelGroup> = Object.fromEntries(
  CHANNELS.map((c) => [c.value, c.group]),
) as Record<Channel, ChannelGroup>;
export const CHANNEL_GROUP_LABEL: Record<ChannelGroup, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  whatsapp: "WhatsApp",
  call: "Call",
  meeting: "Meeting",
  other: "Other",
};

export const ACTIVITY_KINDS = [
  { value: "intro", label: "Intro / first message" },
  { value: "proposal", label: "Proposal" },
  { value: "demo", label: "Demo sent" },
  { value: "follow_up", label: "Follow-up" },
  { value: "reply", label: "They replied" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]["value"] | "status";
export const ACTIVITY_KIND_VALUES = [
  ...ACTIVITY_KINDS.map((k) => k.value),
  "status",
] as unknown as [ActivityKind, ...ActivityKind[]];
export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
  ...labelsOf(ACTIVITY_KINDS),
  status: "Status change",
};

export const OUTCOMES = [
  { value: "pending", label: "No reply yet" },
  { value: "seen", label: "Seen" },
  { value: "replied", label: "Replied" },
  { value: "interested", label: "Interested" },
  { value: "meeting", label: "Meeting booked" },
  { value: "not_interested", label: "Not interested" },
  { value: "bounced", label: "Bounced / wrong" },
] as const;
export type Outcome = (typeof OUTCOMES)[number]["value"];
export const OUTCOME_VALUES = OUTCOMES.map((o) => o.value) as [Outcome, ...Outcome[]];
export const OUTCOME_LABEL = labelsOf(OUTCOMES);
export const OUTCOME_STYLE: Record<Outcome, string> = {
  pending: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  seen: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  replied: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  interested: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  meeting: "bg-emerald-500/14 text-emerald-700 dark:text-emerald-300",
  not_interested: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  bounced: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400",
};
/** Outcomes that count as "they answered" for reply-rate stats. */
export const POSITIVE_OUTCOMES: Outcome[] = ["replied", "interested", "meeting", "not_interested"];

export const FOLLOW_UP_PRESETS = [
  { days: 3, label: "3 days" },
  { days: 5, label: "5 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "1 month" },
] as const;

/* ------------------------------ Projects ------------------------------ */

export const PROJECT_TYPES = [
  "3D Configurator",
  "2D Configurator",
  "OMS",
  "Quote / BOM tool",
  "Website",
  "Mobile app",
  "Custom software",
  "Maintenance / Support",
] as const;

export const BILLING_TYPES = [
  { value: "one_time", label: "One-time build" },
  { value: "monthly", label: "Monthly service" },
] as const;
export type BillingType = (typeof BILLING_TYPES)[number]["value"];
export const BILLING_LABEL = labelsOf(BILLING_TYPES);

export const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In progress" },
  { value: "on_hold", label: "On hold" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];
export const PROJECT_STATUS_VALUES = PROJECT_STATUSES.map((s) => s.value) as [
  ProjectStatus,
  ...ProjectStatus[],
];
export const PROJECT_STATUS_LABEL = labelsOf(PROJECT_STATUSES);
export const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  planning: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  in_progress: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  on_hold: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  delivered: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  completed: "bg-emerald-500/14 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400",
};
/** Projects in these states still count toward "active" work. */
export const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = ["planning", "in_progress", "on_hold", "delivered"];

/* ------------------------------ Money ------------------------------ */

export const CURRENCIES = ["EUR", "USD", "GBP", "PKR", "AED", "SAR", "CHF", "AUD", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PAYMENT_METHODS = [
  "Bank transfer",
  "Wise",
  "Payoneer",
  "PayPal",
  "Stripe",
  "Cash",
  "Other",
] as const;

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]["value"];
export const INVOICE_STATUS_VALUES = INVOICE_STATUSES.map((s) => s.value) as [
  InvoiceStatus,
  ...InvoiceStatus[],
];
export const INVOICE_STATUS_STYLE: Record<InvoiceStatus | "overdue", string> = {
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  sent: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  paid: "bg-emerald-500/14 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400",
  overdue: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

/* ------------------------------ Tasks ------------------------------ */

export const TASK_PRIORITIES = [
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];

/* ------------------------------ Templates ------------------------------ */

export const TEMPLATE_VARIABLES = [
  { key: "firstName", hint: "Person's first name" },
  { key: "fullName", hint: "Person's full name" },
  { key: "role", hint: "Person's role" },
  { key: "company", hint: "Company name" },
  { key: "country", hint: "Company country" },
  { key: "website", hint: "Company website" },
  { key: "weakness", hint: "Configurator weaknesses you noted" },
  { key: "opportunity", hint: "What you can build for them" },
  { key: "myName", hint: "Your name (Settings)" },
  { key: "myBusiness", hint: "Your business name (Settings)" },
] as const;
