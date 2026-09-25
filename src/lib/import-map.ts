import {
  COMPANY_TYPES,
  OPPORTUNITIES,
  type CompanyStatus,
  type CompanyType,
  type Priority,
} from "@/lib/constants";
import { guessCountryCode } from "@/lib/countries";

/** Fields you can map CSV columns to. */
export const IMPORT_FIELDS = [
  { key: "name", label: "Company name", aliases: ["company name", "company", "name", "organization", "organisation", "account"] },
  { key: "website", label: "Website", aliases: ["website", "url", "site", "domain", "web", "homepage"] },
  { key: "country", label: "Country", aliases: ["country", "nation", "location", "hq"] },
  { key: "city", label: "City", aliases: ["city", "town", "region", "province"] },
  { key: "type", label: "Company type", aliases: ["company type", "type", "category"] },
  { key: "priority", label: "Priority", aliases: ["priority", "prio"] },
  { key: "status", label: "Status", aliases: ["target status", "status", "stage", "pipeline"] },
  { key: "opportunities", label: "Opportunity", aliases: ["potential software opportunity", "potential software opportunities", "opportunity", "opportunities", "software opportunity"] },
  { key: "tags", label: "Tags", aliases: ["tags", "industry", "labels"] },
  { key: "source", label: "Source", aliases: ["source", "lead source"] },
  { key: "notes", label: "Notes", aliases: ["notes", "note", "comments", "description", "remarks"] },
  { key: "contactName", label: "Contact name(s)", aliases: ["contacts", "contact", "contact name", "person", "full name", "people"] },
  { key: "contactRole", label: "Contact role", aliases: ["role", "title", "job title", "position"] },
  { key: "contactEmail", label: "Contact email", aliases: ["email", "e-mail", "contact email", "mail"] },
  { key: "contactLinkedin", label: "Contact LinkedIn", aliases: ["linkedin", "linkedin url", "linkedin profile", "contact linkedin"] },
  { key: "lastContacted", label: "Last contacted", aliases: ["last contacted", "last contact", "last contacted date"] },
  { key: "followUp", label: "Next follow-up", aliases: ["next follow-up date", "next follow up date", "next follow-up", "follow up", "follow-up", "next follow up"] },
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number]["key"];
export type Mapping = Partial<Record<ImportField, string>>;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function autoMap(headers: string[]): Mapping {
  const out: Mapping = {};
  const used = new Set<string>();
  for (const f of IMPORT_FIELDS) {
    const hit =
      headers.find((h) => !used.has(h) && f.aliases.includes(norm(h) as never)) ??
      headers.find((h) => !used.has(h) && f.aliases.some((a) => norm(h).startsWith(a)));
    if (hit) {
      out[f.key] = hit;
      used.add(hit);
    }
  }
  return out;
}

export type ImportRow = {
  name: string;
  website: string;
  country: string;
  city: string;
  type: CompanyType | "";
  priority: Priority | "";
  status: CompanyStatus;
  opportunities: string[];
  tags: string[];
  source: string;
  notes: string;
  contacts: { name: string; role: string; email: string; linkedin: string }[];
  lastContactedAt: string | null;
  followUpAt: string | null;
};

/** Notion exports relations like "Mattia Vanzo (https://www.notion.so/…)". */
function stripNotionLinks(v: string) {
  return v.replace(/\s*\((https?:\/\/[^)]*)\)/g, "").trim();
}

function list(v: string) {
  return stripNotionLinks(v)
    .split(/[,;|\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function mapStatus(v: string): CompanyStatus {
  const t = v.toLowerCase();
  if (!t) return "researching";
  if (/not a fit|not fit|skip|irrelevant/.test(t)) return "not_fit";
  if (/lost|rejected|declined|no interest/.test(t)) return "lost";
  if (/won|client|customer|closed won|signed/.test(t)) return "won";
  if (/proposal|quote|negotiat|opportunit/.test(t)) return "proposal";
  if (/interest|demo|meeting/.test(t)) return "interested";
  if (/engag|replied|respond|talk/.test(t)) return "replied";
  if (/ready/.test(t)) return "ready";
  if (/contact|sent|reached/.test(t)) return "contacted";
  return "researching";
}

function mapType(v: string): CompanyType | "" {
  const t = v.toLowerCase();
  if (!t) return "";
  if (/manufact|producer|maker/.test(t)) return "manufacturer";
  if (/distrib|wholesal/.test(t)) return "distributor";
  if (/install|epc/.test(t)) return "installer";
  if (/develop|ipp/.test(t)) return "developer";
  if (/software|tech/.test(t)) return "software";
  return COMPANY_TYPES.some((c) => c.value === t) ? (t as CompanyType) : "other";
}

function mapDate(v: string): string | null {
  const t = stripNotionLinks(v);
  if (!t) return null;
  const d = new Date(t.replace(/\s*\(.*\)$/, ""));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function mapRow(raw: Record<string, string>, m: Mapping): ImportRow | null {
  const get = (f: ImportField) => (m[f] ? String(raw[m[f]!] ?? "").trim() : "");
  const name = stripNotionLinks(get("name"));
  if (!name) return null;

  // "Italy, Colceresa, Vicenza" -> country Italy, city "Colceresa, Vicenza"
  const countryRaw = stripNotionLinks(get("country"));
  const parts = countryRaw.split(",").map((x) => x.trim()).filter(Boolean);
  const code = guessCountryCode(parts[0] ?? "");
  const city = get("city") || (code && parts.length > 1 ? parts.slice(1).join(", ") : code ? "" : countryRaw);

  const oppRaw = list(get("opportunities"));
  const opportunities: string[] = [];
  const extraTags: string[] = [];
  for (const o of oppRaw) {
    const hit = OPPORTUNITIES.find((x) => x.toLowerCase() === o.toLowerCase() || x.toLowerCase().startsWith(o.toLowerCase()));
    if (hit) opportunities.push(hit);
    else extraTags.push(o);
  }

  const names = list(get("contactName"));
  const role = get("contactRole");
  const email = get("contactEmail");
  const linkedin = get("contactLinkedin");
  const contacts = names.map((n, i) => ({
    name: n,
    role: i === 0 ? role : "",
    email: i === 0 ? email : "",
    linkedin: i === 0 ? linkedin : "",
  }));
  if (!names.length && (email || linkedin)) {
    contacts.push({ name: email.split("@")[0] || "Contact", role, email, linkedin });
  }

  const p = get("priority").trim().toUpperCase().charAt(0);
  return {
    name,
    website: get("website"),
    country: code,
    city,
    type: mapType(get("type")),
    priority: p === "A" || p === "B" || p === "C" ? p : "",
    status: mapStatus(get("status")),
    opportunities: Array.from(new Set(opportunities)),
    tags: Array.from(new Set([...list(get("tags")), ...extraTags])).slice(0, 20),
    source: get("source") || "CSV import",
    notes: get("notes"),
    contacts,
    lastContactedAt: mapDate(get("lastContacted")),
    followUpAt: mapDate(get("followUp")),
  };
}
