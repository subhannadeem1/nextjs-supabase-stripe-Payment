"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

import { addContact, checkContactDuplicate, updateContact } from "@/actions/companies";
import { Field, SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { SENIORITY, type Seniority } from "@/lib/constants";
import type { ContactDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";

type Dup = { companyId: string; companyName: string; personName: string; sameCompany: boolean } | null;

export function ContactDialog({
  open,
  onOpenChange,
  companyId,
  contact,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  contact?: ContactDTO | null;
}) {
  const { pending, run } = useRunAction();
  const [form, setForm] = useState({
    name: contact?.name ?? "",
    role: contact?.role ?? "",
    seniority: (contact?.seniority ?? "") as Seniority | "",
    decisionMaker: contact?.decisionMaker ?? false,
    linkedin: contact?.linkedin ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    notes: contact?.notes ?? "",
  });
  const [dupState, setDupState] = useState<{ key: string; data: Dup } | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const hasContactInfo = Boolean(form.email.trim() || form.linkedin.trim());
  const dupKey = JSON.stringify([form.email.trim(), form.linkedin.trim()]);
  const rawDup = hasContactInfo && dupState?.key === dupKey ? dupState.data : null;
  // Editing the same person is fine.
  const dup = rawDup && contact && rawDup.sameCompany && rawDup.personName === contact.name ? null : rawDup;

  useEffect(() => {
    if (!open || !hasContactInfo) return;
    const [email, linkedin] = JSON.parse(dupKey) as [string, string];
    const t = setTimeout(async () => {
      const res = await checkContactDuplicate({ email, linkedin, excludeCompanyId: companyId });
      if (res.ok) setDupState({ key: dupKey, data: res.data });
    }, 350);
    return () => clearTimeout(t);
  }, [dupKey, hasContactInfo, open, companyId]);

  const submit = () =>
    run(() => (contact ? updateContact(companyId, contact._id, form) : addContact(companyId, form)), {
      success: contact ? "Person updated" : `${form.name} added`,
      onSuccess: () => onOpenChange(false),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit person" : "Add person"}</DialogTitle>
          <DialogDescription>Founders, directors and anyone you approach at this company.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required autoFocus placeholder="e.g. Mattia Vanzo" />
            </Field>
            <Field label="Role / title">
              <Input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. CEO, Sales Director" />
            </Field>
          </div>
          <div className="grid items-end gap-4 sm:grid-cols-2">
            <Field label="Seniority">
              <SelectField
                value={form.seniority}
                onChange={(v) => set("seniority", v as Seniority | "")}
                options={SENIORITY}
                allowEmpty
                emptyLabel="Not set"
                placeholder="Not set"
              />
            </Field>
            <label className="flex h-9 items-center gap-2 text-sm">
              <Checkbox checked={form.decisionMaker} onCheckedChange={(v) => set("decisionMaker", v === true)} />
              Decision-maker ⭐
            </label>
          </div>
          <Field label="LinkedIn profile">
            <Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" />
            </Field>
            <Field label="Phone / WhatsApp">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+39 …" />
            </Field>
          </div>
          {dup ? (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/8 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                {dup.personName || "This person"} is already saved
                {dup.sameCompany ? " in this company" : (
                  <>
                    {" "}at{" "}
                    <Link href={`/marketing/companies/${dup.companyId}`} className="font-medium text-primary underline">
                      {dup.companyName}
                    </Link>
                  </>
                )}
                .
              </span>
            </div>
          ) : null}
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Anything personal or useful…" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.name.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {contact ? "Save" : "Add person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
