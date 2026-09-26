"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { CheckCircle2, FileUp, GitMerge, Loader2, Upload } from "lucide-react";

import { checkImportRows, importCompanies } from "@/actions/import";
import { StatusBadge } from "@/components/badges";
import { SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { countryName, flagEmoji } from "@/lib/countries";
import { autoMap, IMPORT_FIELDS, mapRow, type ImportRow, type Mapping } from "@/lib/import-map";
import { useRunAction } from "@/lib/use-action";

type Parsed = { headers: string[]; rows: Record<string, string>[] };

export function ImportView() {
  const { pending, run } = useRunAction();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [paste, setPaste] = useState("");
  const [merge, setMerge] = useState(true);
  const [existing, setExisting] = useState<({ id: string; name: string } | null)[] | null>(null);
  const [result, setResult] = useState<{ created: number; merged: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  const load = (text: string) => {
    setError("");
    setResult(null);
    setExisting(null);
    const res = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: "greedy" });
    const headers = (res.meta.fields ?? []).filter(Boolean);
    if (!headers.length || !res.data.length) {
      setError("Couldn’t read any rows. Make sure the first line has column names.");
      return;
    }
    setParsed({ headers, rows: res.data.slice(0, 3000) });
    setMapping(autoMap(headers));
  };

  const mapped = useMemo(
    () => (parsed ? parsed.rows.map((r) => mapRow(r, mapping)).filter((r): r is ImportRow => Boolean(r)) : []),
    [parsed, mapping],
  );

  const check = () =>
    run(() => checkImportRows(mapped.map((r) => ({ name: r.name, website: r.website }))), {
      onSuccess: (d) => setExisting(d),
    });

  const dupCount = existing?.filter(Boolean).length ?? 0;

  return (
    <div className="grid gap-6">
      {!parsed ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-card p-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-brand">
              <FileUp className="size-6" />
            </span>
            <span className="text-[15px] font-semibold">Choose a CSV file</span>
            <span className="max-w-sm text-sm text-muted-foreground">
              Notion: open your Companies database → ••• → Export → Markdown & CSV. Exhibitor lists and spreadsheets work too.
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) load(await f.text());
            }}
          />
          <div className="grid gap-2 rounded-2xl border bg-card p-5">
            <Label>…or paste CSV text</Label>
            <Textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={8}
              placeholder={"Company Name,Website,Country\nSUN-AGE,sun-age.it,Italy"}
              className="font-mono text-xs"
            />
            <Button variant="outline" className="w-fit" disabled={!paste.trim()} onClick={() => load(paste)}>
              <Upload /> Read pasted text
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive lg:col-span-2">{error}</p> : null}
        </div>
      ) : result ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
          <CheckCircle2 className="size-12 text-success" />
          <h2 className="text-lg font-semibold">Import finished</h2>
          <p className="text-sm text-muted-foreground">
            {result.created} added · {result.merged} merged into existing · {result.skipped} skipped
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/marketing/companies">Open client hunting</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setParsed(null);
                setResult(null);
                setPaste("");
              }}
            >
              Import another file
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border bg-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">1. Match your columns</h2>
                <p className="text-sm text-muted-foreground">
                  {parsed.rows.length} rows · {parsed.headers.length} columns. Guessed automatically — adjust if needed.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setParsed(null)}>
                Choose another file
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {IMPORT_FIELDS.map((f) => (
                <div key={f.key} className="grid gap-1.5">
                  <Label className="text-xs">{f.label}</Label>
                  <SelectField
                    value={mapping[f.key] ?? ""}
                    onChange={(v) => {
                      setExisting(null);
                      setMapping((m) => ({ ...m, [f.key]: v || undefined }));
                    }}
                    options={parsed.headers.map((h) => ({ value: h, label: h }))}
                    allowEmpty
                    emptyLabel="— don’t import —"
                    placeholder="— don’t import —"
                    size="sm"
                  />
                </div>
              ))}
            </div>
            {!mapping.name ? <p className="mt-3 text-sm text-destructive">Pick which column holds the company name.</p> : null}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">2. Preview</h2>
                <p className="text-sm text-muted-foreground">
                  {mapped.length} companies ready
                  {existing ? ` · ${dupCount} already in your list` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={merge} onCheckedChange={(v) => setMerge(v === true)} />
                  Merge duplicates (fill empty fields, add new people)
                </label>
                {!existing ? (
                  <Button variant="outline" onClick={check} disabled={pending || !mapped.length}>
                    {pending ? <Loader2 className="animate-spin" /> : <GitMerge />} Check duplicates
                  </Button>
                ) : null}
                <Button
                  disabled={pending || !mapped.length}
                  onClick={() => run(() => importCompanies(mapped, { merge }), { success: "Import done", onSuccess: setResult })}
                >
                  {pending ? <Loader2 className="animate-spin" /> : <Upload />} Import {mapped.length}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Website</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">People</th>
                    <th className="px-3 py-2">Opportunity</th>
                    <th className="px-3 py-2">In your list?</th>
                  </tr>
                </thead>
                <tbody>
                  {mapped.slice(0, 100).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{r.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.website || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.country ? `${flagEmoji(r.country)} ${countryName(r.country)}` : "—"}
                        {r.city ? <span className="text-muted-foreground"> · {r.city}</span> : null}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.contacts.map((c) => c.name).join(", ") || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.opportunities.join(", ") || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {existing ? (
                          existing[i] ? (
                            <span className="text-warning">{merge ? "Merge into " : "Skip — "}{existing[i]!.name}</span>
                          ) : (
                            <span className="text-success">New</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mapped.length > 100 ? <p className="mt-2 text-xs text-muted-foreground">Showing first 100 of {mapped.length}.</p> : null}
          </section>
        </>
      )}
    </div>
  );
}
