"use server";

import { z } from "zod";

import { mutate, query } from "@/lib/action";
import { COMPANY_STATUS_VALUES, COMPANY_TYPES, PRIORITIES } from "@/lib/constants";
import { letterOf, nameKey, normalizeDomain, normalizeLinkedIn } from "@/lib/normalize";
import { Company } from "@/models/Company";

const Row = z.object({
  name: z.string().trim().min(1).max(200),
  website: z.string().trim().max(300).default(""),
  country: z.string().trim().max(2).default(""),
  city: z.string().trim().max(120).default(""),
  type: z.enum([...COMPANY_TYPES.map((t) => t.value), ""]).default(""),
  priority: z.enum([...PRIORITIES.map((p) => p.value), ""]).default(""),
  status: z.enum(COMPANY_STATUS_VALUES).default("researching"),
  opportunities: z.array(z.string().max(60)).max(20).default([]),
  tags: z.array(z.string().max(60)).max(30).default([]),
  source: z.string().trim().max(200).default(""),
  notes: z.string().max(20000).default(""),
  contacts: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        role: z.string().trim().max(120).default(""),
        email: z.string().trim().max(200).default(""),
        linkedin: z.string().trim().max(300).default(""),
      }),
    )
    .max(30)
    .default([]),
  lastContactedAt: z.string().nullish(),
  followUpAt: z.string().nullish(),
});

/** For the preview: which rows already exist in your list? */
export async function checkImportRows(rows: { name: string; website: string }[]) {
  return query(async () => {
    const list = rows.slice(0, 3000);
    const domains = list.map((r) => normalizeDomain(r.website)).filter(Boolean);
    const keys = list.map((r) => nameKey(r.name)).filter(Boolean);
    const found = await Company.find({ $or: [{ domain: { $in: domains } }, { nameKey: { $in: keys } }] })
      .select("name domain nameKey")
      .lean();
    return list.map((r) => {
      const d = normalizeDomain(r.website);
      const k = nameKey(r.name);
      const hit = found.find((c) => (d && c.domain === d) || (k && c.nameKey === k));
      return hit ? { id: String(hit._id), name: hit.name } : null;
    });
  });
}

export async function importCompanies(rawRows: unknown[], opts: { merge: boolean }) {
  return mutate(async () => {
    const rows = z.array(Row).max(3000).parse(rawRows);
    let created = 0;
    let merged = 0;
    let skipped = 0;

    for (const r of rows) {
      const domain = normalizeDomain(r.website);
      const key = nameKey(r.name);
      const existing = await Company.findOne(domain ? { $or: [{ domain }, { nameKey: key }] } : { nameKey: key });
      const lastContactedAt = r.lastContactedAt ? new Date(r.lastContactedAt) : null;
      const followUpAt = r.followUpAt ? new Date(r.followUpAt) : null;

      if (existing) {
        if (!opts.merge) {
          skipped++;
          continue;
        }
        // Fill only what's empty; never overwrite what you already wrote.
        const fill = (field: string, value: unknown) => {
          const cur = existing.get(field);
          if ((cur === "" || cur === null || cur === undefined) && value) existing.set(field, value);
        };
        fill("website", r.website);
        if (!existing.domain && domain) {
          const clash = await Company.exists({ domain, _id: { $ne: existing._id } });
          if (!clash) existing.domain = domain;
        }
        fill("country", r.country);
        fill("city", r.city);
        fill("type", r.type);
        fill("priority", r.priority);
        fill("source", r.source);
        fill("lastContactedAt", lastContactedAt);
        fill("followUpAt", followUpAt);
        if (r.notes && !existing.notes.includes(r.notes)) existing.notes = [existing.notes, r.notes].filter(Boolean).join("\n\n");
        existing.opportunities = Array.from(new Set([...existing.opportunities, ...r.opportunities]));
        existing.tags = Array.from(new Set([...existing.tags, ...r.tags]));
        for (const c of r.contacts) {
          const same = existing.contacts.some(
            (p) => p.name.toLowerCase() === c.name.toLowerCase() || (c.email && p.email?.toLowerCase() === c.email.toLowerCase()),
          );
          if (!same) existing.contacts.push({ ...c, linkedinKey: normalizeLinkedIn(c.linkedin) });
        }
        await existing.save();
        merged++;
      } else {
        await Company.create({
          ...r,
          nameKey: key,
          letter: letterOf(r.name),
          domain,
          lastContactedAt,
          followUpAt,
          statusChangedAt: new Date(),
          contacts: r.contacts.map((c) => ({ ...c, linkedinKey: normalizeLinkedIn(c.linkedin) })),
        });
        created++;
      }
    }
    return { created, merged, skipped };
  });
}
