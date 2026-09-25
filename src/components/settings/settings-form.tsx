"use client";

import { useState } from "react";
import { Building2, DatabaseBackup, Download, FileText, Loader2, Monitor, Moon, Palette, Save, Send, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { saveSettings } from "@/actions/settings";
import { Field, SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, type Currency } from "@/lib/constants";
import type { SettingsDTO } from "@/lib/types";
import { useRunAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

export function SettingsForm({ settings, email }: { settings: SettingsDTO; email: string }) {
  const { pending, run } = useRunAction();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({
    businessName: settings.businessName,
    ownerName: settings.ownerName,
    email: settings.email,
    phone: settings.phone,
    website: settings.website,
    address: settings.address,
    taxId: settings.taxId,
    defaultCurrency: settings.defaultCurrency as Currency,
    followUpDays: String(settings.followUpDays),
    invoicePrefix: settings.invoicePrefix,
    nextInvoiceNumber: String(settings.nextInvoiceNumber),
    paymentDetails: settings.paymentDetails,
    invoiceNotes: settings.invoiceNotes,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveSettings(form), { success: "Settings saved" });
      }}
    >
      <Card>
        <CardHeader className="flex-col items-start gap-1">
          <CardTitle>
            <Building2 className="size-4 text-primary" /> Your business
          </CardTitle>
          <CardDescription>Shown in the sidebar, on invoices and in message templates ({"{{myName}}"}, {"{{myBusiness}}"}).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} required />
          </Field>
          <Field label="Your name">
            <Input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Used in greetings and templates" />
          </Field>
          <Field label="Business email">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone / WhatsApp">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label="Tax / registration ID">
            <Input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col items-start gap-1">
          <CardTitle>
            <Send className="size-4 text-primary" /> Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Default currency" hint="Used for totals and new projects. Other currencies are kept separately, never converted.">
            <SelectField value={form.defaultCurrency} onChange={(v) => set("defaultCurrency", (v || "EUR") as Currency)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Default follow-up (days)" hint="Suggested when you log a message. 0 = don’t suggest.">
            <Input type="number" min={0} max={90} value={form.followUpDays} onChange={(e) => set("followUpDays", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col items-start gap-1">
          <CardTitle>
            <FileText className="size-4 text-primary" /> Invoices
          </CardTitle>
          <CardDescription>
            Next number will be <b>{`${form.invoicePrefix}${new Date().getFullYear()}-${String(Number(form.nextInvoiceNumber) || 1).padStart(3, "0")}`}</b>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Number prefix">
            <Input value={form.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value)} />
          </Field>
          <Field label="Next number">
            <Input type="number" min={1} value={form.nextInvoiceNumber} onChange={(e) => set("nextInvoiceNumber", e.target.value)} />
          </Field>
          <Field label="Payment details (bank, IBAN, Wise, PayPal…)" className="sm:col-span-2">
            <Textarea value={form.paymentDetails} onChange={(e) => set("paymentDetails", e.target.value)} rows={3} />
          </Field>
          <Field label="Default note on invoices" className="sm:col-span-2">
            <Textarea value={form.invoiceNotes} onChange={(e) => set("invoiceNotes", e.target.value)} rows={2} />
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" disabled={pending} className="shadow-xl">
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Save settings
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>
              <Palette className="size-4 text-primary" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {[
              { v: "light", label: "Light", icon: Sun },
              { v: "dark", label: "Dark", icon: Moon },
              { v: "system", label: "System", icon: Monitor },
            ].map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => setTheme(t.v)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
                  theme === t.v ? "border-primary/60 bg-accent text-accent-foreground" : "hover:bg-accent/40",
                )}
                suppressHydrationWarning
              >
                <t.icon className="size-5" />
                {t.label}
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>
              <DatabaseBackup className="size-4 text-primary" /> Backup & login
            </CardTitle>
            <CardDescription>
              Signed in as <b>{email}</b>. Email and password are set in your hosting environment variables (see README).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a href="/api/export">
                <Download /> Download all data (JSON)
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
