"use server";

import { Types } from "mongoose";
import { z } from "zod";

import { mutate, UserError } from "@/lib/action";
import { CHANNEL_VALUES } from "@/lib/constants";
import { Activity } from "@/models/Activity";
import { Demo } from "@/models/Demo";
import { Template } from "@/models/Template";

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid id");

/* -------------------------------- Templates -------------------------------- */

const TemplateInput = z.object({
  title: z.string().trim().min(1, "Give it a name").max(120),
  channel: z.enum(CHANNEL_VALUES),
  kind: z.enum(["intro", "proposal", "demo", "follow_up"]),
  subject: z.string().trim().max(300).default(""),
  body: z.string().trim().min(1, "Write the message").max(10000),
});
export type TemplateInputT = z.input<typeof TemplateInput>;

export async function saveTemplate(id: string | null, raw: TemplateInputT) {
  return mutate(async () => {
    const input = TemplateInput.parse(raw);
    if (id) {
      objectId.parse(id);
      const res = await Template.updateOne({ _id: id }, { $set: input });
      if (!res.matchedCount) throw new UserError("Template not found");
      return { id };
    }
    const doc = await Template.create(input);
    return { id: String(doc._id) };
  });
}

export async function duplicateTemplate(id: string) {
  return mutate(async () => {
    objectId.parse(id);
    const t = await Template.findById(id).lean();
    if (!t) throw new UserError("Template not found");
    const doc = await Template.create({ title: `${t.title} (copy)`, channel: t.channel, kind: t.kind, subject: t.subject, body: t.body });
    return { id: String(doc._id) };
  });
}

export async function deleteTemplate(id: string) {
  return mutate(async () => {
    objectId.parse(id);
    await Promise.all([
      Template.deleteOne({ _id: id }),
      Activity.updateMany({ templateId: id }, { $set: { templateId: null } }),
    ]);
    return null;
  });
}

/* ---------------------------------- Demos ---------------------------------- */

const DemoInput = z.object({
  title: z.string().trim().min(1, "Give it a name").max(120),
  product: z.string().trim().max(80).default(""),
  url: z.string().trim().min(1, "Paste the demo link").max(1000),
  description: z.string().trim().max(3000).default(""),
});
export type DemoInputT = z.input<typeof DemoInput>;

export async function saveDemo(id: string | null, raw: DemoInputT) {
  return mutate(async () => {
    const input = DemoInput.parse(raw);
    if (id) {
      objectId.parse(id);
      const res = await Demo.updateOne({ _id: id }, { $set: input });
      if (!res.matchedCount) throw new UserError("Demo not found");
      return { id };
    }
    const doc = await Demo.create(input);
    return { id: String(doc._id) };
  });
}

export async function deleteDemo(id: string) {
  return mutate(async () => {
    objectId.parse(id);
    await Promise.all([
      Demo.deleteOne({ _id: id }),
      Activity.updateMany({ demoId: id }, { $set: { demoId: null } }),
    ]);
    return null;
  });
}

/* ----------------------------- Starter templates ----------------------------- */

const STARTERS: TemplateInputT[] = [
  {
    title: "LinkedIn connection note",
    channel: "linkedin_connect",
    kind: "intro",
    subject: "",
    body: "Hi {{firstName}}, I build online configurators for solar mounting companies. I had a look at {{company}} and have a couple of ideas that could help your sales team — would be glad to connect.",
  },
  {
    title: "LinkedIn proposal",
    channel: "linkedin_message",
    kind: "proposal",
    subject: "",
    body: "Hi {{firstName}},\n\nThanks for connecting! I help racking & mounting manufacturers sell faster with online configurators — installers design their system, get the bill of materials and a quote in minutes.\n\nI looked at {{company}}'s current setup and noticed: {{weakness}}\n\nI can build a {{opportunity}} tailored to your product range. Shall I send a short demo video?\n\nBest,\n{{myName}}",
  },
  {
    title: "Email proposal",
    channel: "email",
    kind: "proposal",
    subject: "{{opportunity}} for {{company}}",
    body: "Hi {{firstName}},\n\nI'm {{myName}} from {{myBusiness}}. We build configurators and order-management tools for solar mounting system companies.\n\nWhile reviewing {{website}} I noticed: {{weakness}}\n\nA {{opportunity}} could let your installers configure a complete system, see the bill of materials and request a quote without waiting for your team.\n\nI'd be happy to show you a 5-minute demo. Would next week work?\n\nKind regards,\n{{myName}}\n{{myBusiness}}",
  },
  {
    title: "Friendly follow-up",
    channel: "linkedin_message",
    kind: "follow_up",
    subject: "",
    body: "Hi {{firstName}}, just bringing this back to the top of your inbox. I put together a short demo of what a {{opportunity}} could look like for {{company}} — shall I send it over?",
  },
  {
    title: "Demo share",
    channel: "email",
    kind: "demo",
    subject: "Demo: {{opportunity}} for {{company}}",
    body: "Hi {{firstName}},\n\nAs promised, here is the demo: [paste link]\n\nIt shows how installers would configure a system, get the BOM and send a quote request directly to {{company}}.\n\nHappy to adapt it to your products — let me know what you think.\n\nBest,\n{{myName}}",
  },
];

export async function addStarterTemplates() {
  return mutate(async () => {
    const existing = new Set((await Template.find().select("title").lean()).map((t) => t.title));
    const toAdd = STARTERS.filter((t) => !existing.has(t.title)).map((t) => TemplateInput.parse(t));
    if (toAdd.length) await Template.insertMany(toAdd);
    return { added: toAdd.length };
  });
}
