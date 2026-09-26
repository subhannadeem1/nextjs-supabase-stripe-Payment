# Business OS — scope

Personal management system for a one-person business that builds configurators,
OMS and custom software for solar racking / mounting companies — some as
one-time builds, some as monthly services.

**Main problem it solves:** in Notion, companies and contacts lived in separate
databases, companies got entered twice, and it was impossible to remember which
company was already researched, who was approached, on which channel, and when.

## Principles

- **One company record, everywhere.** A company found while hunting is the same
  record that later becomes a client, gets projects, invoices and payments.
- **People live inside their company.** No separate contacts database.
- **Never enter a company twice.** Website domains are normalised and unique;
  similar names are flagged while typing.
- **Automatic where it’s obvious.** Last-contacted date, status moves
  (contacted → replied → interested → proposal), milestone paid status and
  money totals are computed, not typed.
- **Simple, modern, fast.** Light/dark theme, violet→sky gradient, Ctrl K search,
  works on a phone.

## Built

### Phase 0 — Foundation
- Next.js 16, TypeScript, Tailwind v4, shadcn-style UI, MongoDB/Mongoose
- Single-admin login (env credentials, signed cookie), proxy guard
- Sidebar shell, quick-add menu, Ctrl K command palette, light/dark mode

### Phase 1 — Marketing → Client hunting
- Companies list: A–Z groups + letter bar, saved views, filters, search incl.
  people/emails, sort, board view, mobile cards
- Add company with live duplicate guard (domain + name)
- Company page: configurator analysis, people (+ per-channel outreach status),
  activity timeline with editable results, research checklist (auto “Ready to
  contact”), follow-up with snooze, notes autosave
- Outreach log with automatic status moves, “already contacted” warning,
  follow-up presets; replies mark the earlier message as answered
- Follow-ups page incl. “going cold” list; Today dashboard

### Phase 1.5 — Marketing extras
- Message templates with variables, starter set, use-from-company + log as sent
- Demo library with who-got-which-demo tracking
- Insights: outreach per week by channel, funnel, reply rate per channel and
  per template, top countries
- CSV import (Notion export) with auto-mapping, duplicate check and merge

### Phase 2 — Clients & projects
- Projects (one-time / monthly), scope checklist with “not included”, timeline,
  milestones, payments, links, notes, tasks, invoices
- Starting a project marks the company as Won
- Monthly services grid (paid / due / late per month), MRR
- Clients page with received / pending / last payment

### Phase 3 — Finance & work
- Finance overview: this month / year, pending, MRR, unpaid invoices, income
  chart, coming up, top clients, payments
- Invoices: numbering, editor, milestones as lines, print / PDF, mark paid
  (payment recorded and split onto milestones)
- Tasks page; Settings (business profile, defaults, invoice numbering, backup)

## Later (not built yet)

- Chrome extension — save a person from their LinkedIn profile in one click
- AI pitch — draft a personalised message from the weakness notes
- Gmail sync — sent emails logged automatically
- Daily summary email — follow-ups, tasks and money due each morning
