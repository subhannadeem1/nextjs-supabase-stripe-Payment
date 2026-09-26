import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Repeat } from "lucide-react";

import { ProjectStatusBadge } from "@/components/badges";
import { CompanyLogo } from "@/components/company-logo";
import { EmptyState } from "@/components/empty-state";
import { CountryLabel } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { RelTime } from "@/components/rel-time";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { listClients } from "@/data/clients";
import { getSettings } from "@/data/settings";
import { formatMoneyMap, mergeMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const [clients, settings] = await Promise.all([listClients(), getSettings()]);
  const cur = settings.defaultCurrency;
  const totalReceived = mergeMoney(...clients.map((c) => c.received));
  const totalPending = mergeMoney(...clients.map((c) => c.pending));
  const totalMrr = mergeMoney(...clients.map((c) => c.mrr));

  return (
    <>
      <PageHeader
        title="Clients"
        description="Companies you’ve won — their projects, what they’ve paid and what’s still open."
      />
      {clients.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No clients yet"
          description="Mark a company as “Won” or start a project for it, and it appears here."
          action={
            <Button asChild>
              <Link href="/marketing/companies">Go to client hunting</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Clients" value={clients.length} icon={Handshake} />
            <StatCard label="Received (all time)" value={formatMoneyMap(totalReceived, cur, { compact: true })} tone="brand" />
            <StatCard label="Pending" value={formatMoneyMap(totalPending, cur, { compact: true })} tone={Object.keys(totalPending).length ? "warning" : "default"} hint={`MRR ${formatMoneyMap(totalMrr, cur)}`} />
          </div>
          <div className="grid gap-3">
            {clients.map((c) => (
              <div key={c.company._id} className="grid gap-4 rounded-xl border bg-card p-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <CompanyLogo name={c.company.name} domain={c.company.domain} className="size-11 rounded-xl" />
                  <div className="min-w-0">
                    <Link href={`/marketing/companies/${c.company._id}`} className="block truncate font-semibold hover:text-primary">
                      {c.company.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <CountryLabel code={c.company.country} />
                      {c.company.primaryContact ? <span>· {c.company.primaryContact}</span> : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.projects.length === 0 ? <span className="text-sm text-muted-foreground">No projects yet</span> : null}
                  {c.projects.slice(0, 4).map((p) => (
                    <Link key={p._id} href={`/projects/${p._id}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-xs hover:bg-accent/50">
                      {p.billing === "monthly" ? <Repeat className="size-3 text-muted-foreground" /> : null}
                      <span className="truncate">{p.title}</span>
                      <ProjectStatusBadge status={p.status} className="py-0 text-[10px]" />
                    </Link>
                  ))}
                </div>
                <dl className="grid grid-cols-3 gap-2 text-right text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Received</dt>
                    <dd className="font-semibold tabular-nums">{formatMoneyMap(c.received, cur, { compact: true })}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Pending</dt>
                    <dd className={Object.keys(c.pending).length ? "font-semibold text-warning tabular-nums" : "tabular-nums text-muted-foreground"}>
                      {formatMoneyMap(c.pending, cur, { compact: true })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Last paid</dt>
                    <dd className="text-xs">
                      <RelTime date={c.lastPaymentAt} />
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
