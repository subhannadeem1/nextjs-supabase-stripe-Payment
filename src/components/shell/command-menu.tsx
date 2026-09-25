"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  CheckSquare,
  FileText,
  Loader2,
  Plus,
  Receipt,
  UserRound,
} from "lucide-react";

import { globalSearch, type SearchHit } from "@/actions/search";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { StatusBadge } from "@/components/badges";
import type { CompanyStatus } from "@/lib/constants";
import { flagEmoji } from "@/lib/countries";

import { NAV, SETTINGS_ITEM } from "./nav";
import { useQuickActions } from "./quick-actions";

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const quick = useQuickActions();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit | null>(null);
  const [pending, startTransition] = useTransition();
  const reqId = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const text = q.trim();
    const id = ++reqId.current;
    const t = setTimeout(() => {
      if (!text) {
        setHits(null);
        return;
      }
      startTransition(async () => {
        const res = await globalSearch(text);
        if (id === reqId.current && res.ok) setHits(res.data);
      });
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  const go = (href: string) => {
    onOpenChange(false);
    setQ("");
    router.push(href);
  };
  const act = (fn: () => void) => {
    onOpenChange(false);
    setQ("");
    fn();
  };

  const hasHits = hits && (hits.companies.length || hits.projects.length || hits.invoices.length);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false} title="Search">
      <CommandInput
        placeholder="Search companies, people, projects, invoices…"
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        {q.trim() && !pending && !hasHits ? <CommandEmpty>No results for “{q}”.</CommandEmpty> : null}
        {pending && !hasHits ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Searching…
          </div>
        ) : null}

        {hits?.companies.length ? (
          <CommandGroup heading="Companies">
            {hits.companies.map((c) => (
              <CommandItem key={c._id} value={`c-${c._id}`} onSelect={() => go(`/marketing/companies/${c._id}`)}>
                {c.person ? <UserRound /> : <Building2 />}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {c.person ? `${c.person} · ` : ""}
                    {c.name} <span className="ml-1">{flagEmoji(c.country)}</span>
                  </div>
                  {c.domain ? <div className="truncate text-xs text-muted-foreground">{c.domain}</div> : null}
                </div>
                <StatusBadge status={c.status as CompanyStatus} className="hidden sm:inline-flex" />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {hits?.projects.length ? (
          <CommandGroup heading="Projects">
            {hits.projects.map((p) => (
              <CommandItem key={p._id} value={`p-${p._id}`} onSelect={() => go(`/projects/${p._id}`)}>
                <Briefcase />
                <span className="truncate">{p.title}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{p.companyName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {hits?.invoices.length ? (
          <CommandGroup heading="Invoices">
            {hits.invoices.map((i) => (
              <CommandItem key={i._id} value={`i-${i._id}`} onSelect={() => go(`/finance/invoices/${i._id}`)}>
                <FileText />
                <span>{i.number}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{i.companyName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {!q.trim() ? (
          <>
            <CommandGroup heading="Quick actions">
              <CommandItem value="new-company" onSelect={() => act(() => quick.open("company"))}>
                <Plus /> Add company
              </CommandItem>
              <CommandItem value="new-project" onSelect={() => act(() => quick.open("project"))}>
                <Briefcase /> New project
              </CommandItem>
              <CommandItem value="new-task" onSelect={() => act(() => quick.open("task"))}>
                <CheckSquare /> New task
              </CommandItem>
              <CommandItem value="new-payment" onSelect={() => act(() => quick.open("payment"))}>
                <Receipt /> Record payment
              </CommandItem>
              <CommandItem value="new-invoice" onSelect={() => act(() => quick.open("invoice"))}>
                <FileText /> New invoice
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Go to">
              {[...NAV.flatMap((g) => g.items), SETTINGS_ITEM].map((item) => (
                <CommandItem key={item.href} value={`nav-${item.href}`} onSelect={() => go(item.href)}>
                  <item.icon /> {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
