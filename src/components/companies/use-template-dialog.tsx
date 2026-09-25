"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Loader2, Mail, MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";

import { logActivity } from "@/actions/activities";
import { EmptyState } from "@/components/empty-state";
import { Field, SelectField } from "@/components/form";
import { LinkedInIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_LABEL, COMPANY_STATUS_LABEL } from "@/lib/constants";
import { inputDatePlus, todayInput } from "@/lib/dates";
import { toUrl } from "@/lib/normalize";
import { missingVars, renderTemplate, templateVars } from "@/lib/templates";
import type { CompanyDTO, TemplateDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";

export function UseTemplateDialog({
  open,
  onOpenChange,
  company,
  templates,
  me,
  presetContactId,
  followUpDays,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  company: CompanyDTO;
  templates: TemplateDTO[];
  me: { ownerName: string; businessName: string };
  presetContactId?: string;
  followUpDays: number;
}) {
  const { pending, run } = useRunAction();
  const [templateId, setTemplateId] = useState(templates[0]?._id ?? "");
  const [contactId, setContactId] = useState(
    presetContactId ?? company.contacts.find((c) => c.decisionMaker)?._id ?? company.contacts[0]?._id ?? "",
  );
  const [edited, setEdited] = useState<{ key: string; subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const template = templates.find((t) => t._id === templateId);
  const contact = company.contacts.find((c) => c._id === contactId) ?? null;
  const vars = useMemo(() => templateVars({ company, contact, me }), [company, contact, me]);
  const key = `${templateId}:${contactId}`;
  const rendered = {
    subject: template ? renderTemplate(template.subject, vars) : "",
    body: template ? renderTemplate(template.body, vars) : "",
  };
  const subject = edited?.key === key ? edited.subject : rendered.subject;
  const body = edited?.key === key ? edited.body : rendered.body;
  const missing = template ? missingVars(`${template.subject}\n${template.body}`, vars) : [];

  const copy = async () => {
    const text = template?.channel === "email" && subject ? `Subject: ${subject}\n\n${body}` : body;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn’t copy — select the text and copy manually");
    }
  };

  const logSent = () => {
    if (!template) return;
    run(
      () =>
        logActivity({
          companyId: company._id,
          contactId: contact?._id ?? null,
          channel: template.channel,
          kind: template.kind,
          date: todayInput(),
          summary: `${template.title}: ${body.slice(0, 280)}${body.length > 280 ? "…" : ""}`,
          outcome: "pending",
          templateId: template._id,
          followUpDate: followUpDays > 0 ? inputDatePlus(followUpDays) : undefined,
        }),
      {
        success: "Logged as sent",
        onSuccess: (data) => {
          if (data?.moved) toast.success(`${company.name} moved to ${COMPANY_STATUS_LABEL[data.moved.to]}`);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Use a message template</DialogTitle>
          <DialogDescription>Filled in with {company.name}’s details. Edit, copy, send, then log it.</DialogDescription>
        </DialogHeader>
        {templates.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="No templates yet"
            description="Save your LinkedIn and email proposals once, reuse them for every company."
            action={
              <Button asChild>
                <Link href="/marketing/templates">Create a template</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Template">
                <SelectField
                  value={templateId}
                  onChange={setTemplateId}
                  options={templates.map((t) => ({ value: t._id, label: `${t.title} · ${CHANNEL_LABEL[t.channel]}` }))}
                />
              </Field>
              <Field label="Send to">
                <SelectField
                  value={contactId}
                  onChange={setContactId}
                  options={company.contacts.map((c) => ({ value: c._id, label: c.role ? `${c.name} · ${c.role}` : c.name }))}
                  allowEmpty
                  emptyLabel="No specific person"
                  placeholder="No specific person"
                />
              </Field>
            </div>
            {template?.channel === "email" ? (
              <Field label="Subject">
                <Input value={subject} onChange={(e) => setEdited({ key, subject: e.target.value, body })} />
              </Field>
            ) : null}
            <Field label="Message">
              <Textarea
                value={body}
                onChange={(e) => setEdited({ key, subject, body: e.target.value })}
                rows={10}
                className="font-[450]"
              />
            </Field>
            {missing.length ? (
              <p className="text-xs text-warning">
                Missing: {missing.map((m) => `{{${m}}}`).join(", ")} — fill them in above or add the info to the company.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />} Copy
              </Button>
              {template?.channel === "email" && contact?.email ? (
                <Button variant="outline" asChild>
                  <a href={`mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                    <Mail /> Open in email app
                  </a>
                </Button>
              ) : null}
              {template?.channel.startsWith("linkedin") && contact?.linkedin ? (
                <Button variant="outline" asChild>
                  <a href={toUrl(contact.linkedin)} target="_blank" rel="noreferrer">
                    <LinkedInIcon className="size-4" /> Open LinkedIn <ExternalLink className="size-3" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        )}
        {templates.length ? (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="button" onClick={logSent} disabled={pending || !template}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              Log as sent
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
