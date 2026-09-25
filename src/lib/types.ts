/**
 * Plain, serialisable shapes passed from server to client components.
 * Dates are ISO strings, ids are hex strings.
 */
import type {
  ActivityKind,
  BillingType,
  Channel,
  CompanyStatus,
  CompanyType,
  ConfiguratorExists,
  InvoiceStatus,
  Outcome,
  Priority,
  ProjectStatus,
  Seniority,
  TaskPriority,
} from "@/lib/constants";
import type { MoneyMap } from "@/lib/money";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

export interface ContactDTO {
  _id: string;
  name: string;
  role: string;
  seniority: Seniority | "";
  decisionMaker: boolean;
  linkedin: string;
  email: string;
  phone: string;
  notes: string;
}

export interface CompanyDTO {
  _id: string;
  name: string;
  letter: string;
  website: string;
  domain: string;
  country: string;
  city: string;
  type: CompanyType | "";
  segments: string[];
  priority: Priority | "";
  status: CompanyStatus;
  statusChangedAt: string | null;
  closedReason: string;
  configurator: {
    exists: ConfiguratorExists;
    url: string;
    kind: string;
    weaknesses: string;
  };
  opportunities: string[];
  research: { website: boolean; configurator: boolean; decisionMaker: boolean; contactInfo: boolean };
  source: string;
  tags: string[];
  notes: string;
  contacts: ContactDTO[];
  lastContactedAt: string | null;
  followUpAt: string | null;
  followUpNote: string;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight row for the companies list / board. */
export interface CompanyRow {
  _id: string;
  name: string;
  letter: string;
  website: string;
  domain: string;
  country: string;
  city: string;
  type: CompanyType | "";
  priority: Priority | "";
  status: CompanyStatus;
  configurator: { exists: ConfiguratorExists; kind: string };
  opportunities: string[];
  tags: string[];
  contacts: { _id: string; name: string; role: string; email: string; decisionMaker: boolean }[];
  lastContactedAt: string | null;
  followUpAt: string | null;
  followUpNote: string;
  createdAt: string;
}

export interface ActivityDTO {
  _id: string;
  companyId: string;
  contactId: string | null;
  contactName: string;
  channel: Channel | "";
  kind: ActivityKind;
  direction: "out" | "in" | "none";
  date: string;
  summary: string;
  link: string;
  outcome: Outcome | "";
  demoId: string | null;
  templateId: string | null;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
  company?: { _id: string; name: string; domain: string } | null;
}

export interface TemplateDTO {
  _id: string;
  title: string;
  channel: Channel;
  kind: "intro" | "proposal" | "demo" | "follow_up";
  subject: string;
  body: string;
  updatedAt: string;
  usedCount?: number;
}

export interface DemoDTO {
  _id: string;
  title: string;
  product: string;
  url: string;
  description: string;
  createdAt: string;
  sentCount?: number;
  lastSentAt?: string | null;
}

export interface ScopeItemDTO {
  _id: string;
  title: string;
  included: boolean;
  done: boolean;
}

export interface MilestoneDTO {
  _id: string;
  title: string;
  dueDate: string | null;
  amount: number;
  done: boolean;
  doneAt: string | null;
  paid?: number;
}

export interface ProjectDTO {
  _id: string;
  companyId: string;
  title: string;
  type: string;
  billing: BillingType;
  status: ProjectStatus;
  currency: string;
  value: number;
  monthlyAmount: number;
  billingDay: number;
  startDate: string | null;
  dueDate: string | null;
  endDate: string | null;
  description: string;
  scope: ScopeItemDTO[];
  milestones: MilestoneDTO[];
  links: { _id: string; label: string; url: string }[];
  notes: string;
  createdAt: string;
  company?: { _id: string; name: string; domain: string; country: string } | null;
  finance?: ProjectFinance;
}

export interface ProjectFinance {
  /** Total expected so far (one-time: contract value, monthly: months elapsed × amount). */
  expected: number;
  received: number;
  pending: number;
  /** Monthly only: unpaid periods up to and including the current month. */
  unpaidPeriods: string[];
}

export interface PaymentDTO {
  _id: string;
  companyId: string;
  projectId: string | null;
  milestoneId: string | null;
  invoiceId: string | null;
  amount: number;
  currency: string;
  date: string;
  method: string;
  period: string;
  reference: string;
  note: string;
  company?: { _id: string; name: string } | null;
  project?: { _id: string; title: string } | null;
}

export interface InvoiceItemDTO {
  _id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceDTO {
  _id: string;
  number: string;
  companyId: string;
  projectId: string | null;
  status: InvoiceStatus;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  items: InvoiceItemDTO[];
  taxRate: number;
  discount: number;
  notes: string;
  paidAt: string | null;
  sentAt: string | null;
  createdAt: string;
  company?: CompanyDTO | { _id: string; name: string; country?: string } | null;
  project?: { _id: string; title: string } | null;
}

export interface TaskDTO {
  _id: string;
  title: string;
  notes: string;
  dueDate: string | null;
  priority: TaskPriority;
  done: boolean;
  doneAt: string | null;
  companyId: string | null;
  projectId: string | null;
  createdAt: string;
  company?: { _id: string; name: string } | null;
  project?: { _id: string; title: string } | null;
}

export interface SettingsDTO {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  taxId: string;
  defaultCurrency: string;
  followUpDays: number;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  paymentDetails: string;
  invoiceNotes: string;
}

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

export type { MoneyMap };
