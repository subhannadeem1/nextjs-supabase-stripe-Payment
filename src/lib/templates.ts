import { countryName } from "@/lib/countries";
import { firstName } from "@/lib/utils";

export type TemplateVars = Record<string, string>;

export function templateVars(opts: {
  company?: { name: string; country?: string; website?: string; domain?: string; configurator?: { weaknesses?: string }; opportunities?: string[] } | null;
  contact?: { name: string; role?: string } | null;
  me?: { ownerName?: string; businessName?: string } | null;
}): TemplateVars {
  const { company, contact, me } = opts;
  return {
    firstName: contact ? firstName(contact.name) : "",
    fullName: contact?.name ?? "",
    role: contact?.role ?? "",
    company: company?.name ?? "",
    country: countryName(company?.country),
    website: company?.domain || company?.website || "",
    weakness: company?.configurator?.weaknesses?.trim() ?? "",
    opportunity: (company?.opportunities ?? []).join(", "),
    myName: me?.ownerName ?? "",
    myBusiness: me?.businessName ?? "",
  };
}

/** Fill {{vars}}. Missing values stay visible as {{name}} so you notice them. */
export function renderTemplate(text: string, vars: TemplateVars) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const v = vars[key];
    return v ? v : match;
  });
}

export function missingVars(text: string, vars: TemplateVars) {
  const out = new Set<string>();
  for (const m of text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) if (!vars[m[1]]) out.add(m[1]);
  return [...out];
}
