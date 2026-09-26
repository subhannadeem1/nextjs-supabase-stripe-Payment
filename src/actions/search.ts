"use server";

import { query } from "@/lib/action";
import { escapeRegex } from "@/lib/normalize";
import { Company } from "@/models/Company";
import { Invoice } from "@/models/Invoice";
import { Project } from "@/models/Project";

export type SearchHit = {
  companies: { _id: string; name: string; domain: string; status: string; country: string; person?: string }[];
  projects: { _id: string; title: string; companyName: string }[];
  invoices: { _id: string; number: string; companyName: string }[];
};

export async function globalSearch(q: string) {
  return query<SearchHit>(async () => {
    const text = q.trim();
    if (text.length < 1) return { companies: [], projects: [], invoices: [] };
    const rx = new RegExp(escapeRegex(text), "i");

    const [companies, projects, invoices] = await Promise.all([
      Company.find({
        $or: [{ name: rx }, { domain: rx }, { "contacts.name": rx }, { "contacts.email": rx }, { tags: rx }],
      })
        .select("name domain status country contacts.name contacts.email")
        .sort({ name: 1 })
        .limit(8)
        .lean(),
      Project.find({ title: rx }).select("title companyId").limit(6).populate("companyId", "name").lean(),
      Invoice.find({ number: rx }).select("number companyId").limit(5).populate("companyId", "name").lean(),
    ]);

    return {
      companies: companies.map((c) => {
        const matchedByName = rx.test(c.name) || rx.test(c.domain ?? "");
        const person = matchedByName
          ? undefined
          : c.contacts?.find((p) => rx.test(p.name) || rx.test(p.email ?? ""))?.name;
        return {
          _id: String(c._id),
          name: c.name,
          domain: c.domain ?? "",
          status: c.status,
          country: c.country ?? "",
          person,
        };
      }),
      projects: projects.map((p) => ({
        _id: String(p._id),
        title: p.title,
        companyName: (p.companyId as unknown as { name?: string } | null)?.name ?? "",
      })),
      invoices: invoices.map((i) => ({
        _id: String(i._id),
        number: i.number,
        companyName: (i.companyId as unknown as { name?: string } | null)?.name ?? "",
      })),
    };
  });
}
