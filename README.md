# Business OS

A personal management system for a solar mounting-software business: find and
track racking companies, log every outreach, run projects, and keep an eye on
money — in one place.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui-style
components · MongoDB (Mongoose)**. Light and dark mode included.

---

## What’s inside

| Area | Features |
| --- | --- |
| **Today** | Follow-ups due, outreach and replies this week, money received and pending, tasks, “going cold” companies, pipeline |
| **Client hunting** | A–Z grouped company list, saved views (Priority A, Ready, Contacted, In talks, Follow-up due, Clients…), filters, search that also finds people and emails, board (kanban) view, mobile cards |
| **Duplicate guard** | Websites are normalised (`https://www.sun-age.it/it` = `sun-age.it`) so a company can never be added twice; similar names are flagged |
| **Company page** | Configurator analysis (weaknesses → your pitch), people with per-channel history (LinkedIn / email / WhatsApp…), activity timeline, research checklist, follow-up with snooze, notes, projects, tasks |
| **Outreach log** | Channel, type, result and next follow-up in one dialog; statuses move forward automatically; warns if you already contacted that person on that channel |
| **Templates** | Proposal / follow-up templates with `{{firstName}}`, `{{company}}`, `{{weakness}}`… filled from the company; copy, open in email / LinkedIn, log as sent |
| **Demo library** | Your demo links and exactly which company received which demo |
| **Insights** | Outreach per week by channel, pipeline funnel, reply rate by channel and template, top countries |
| **Import CSV** | Notion export friendly; auto-maps columns, checks duplicates and merges into existing companies |
| **Projects** | One-time builds and monthly services, scope checklist (incl. “not included”), timeline, milestones with paid status, payments, links, notes |
| **Monthly services** | 12-month paid / due / late grid per client, MRR |
| **Finance** | Income per month, pending, MRR, top clients, payments list |
| **Invoices** | Auto-numbered, line editor with tax/discount, milestones as lines, print / save as PDF, “mark paid” records the payment |
| **Tasks** | Quick add, overdue / today / upcoming, linked to companies and projects |
| **Settings** | Business profile (used on invoices and templates), default currency, follow-up days, invoice numbering, JSON backup |

Search everything with **Ctrl K** (⌘K on Mac). Add anything from the **+ New** button.

---

## Run it locally

Requirements: **Node.js 22+** and a MongoDB database.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

For a local database you can use Docker:

```bash
docker run -d --name business-os-mongo -p 27017:27017 mongo:7
# MONGODB_URI=mongodb://127.0.0.1:27017/business_os
```

### Environment variables

| Name | What it is |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `MONGODB_DB` | Optional database name if it isn’t in the URI |
| `ADMIN_EMAIL` | The only email that can sign in |
| `ADMIN_PASSWORD` | Its password — use a long one |
| `AUTH_SECRET` | Random string (32+ chars) for signing the login cookie — `openssl rand -base64 32` |

---

## Deploy: MongoDB Atlas (free) + Vercel

### 1. Database — MongoDB Atlas free tier

1. Sign up at <https://www.mongodb.com/cloud/atlas> and create a **free M0 cluster**.
2. **Database Access** → *Add New Database User* → username + password (save them).
3. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
   Vercel’s servers don’t have fixed IPs, so this is required.
4. **Database** → *Connect* → *Drivers* → copy the connection string. Put your
   password in it and add a database name before the `?`, e.g.
   `mongodb+srv://me:PASSWORD@cluster0.abcde.mongodb.net/business_os?retryWrites=true&w=majority`

### 2. App — Vercel

1. Merge this branch into `main` on GitHub (or pick the branch in Vercel).
2. Go to <https://vercel.com/new> → **Import** this GitHub repository.
   Framework preset: **Next.js** (detected automatically).
3. Open **Environment Variables** and add `MONGODB_URI`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD` and `AUTH_SECRET`.
4. Click **Deploy**. When it’s done, open the URL and sign in with your
   `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
5. First thing after signing in: open **Settings** and fill in your business
   name, your name, default currency and payment details.

Every push to `main` redeploys automatically.

---

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (Vitest) for duplicate detection, money maths, pipeline rules, templates and CSV mapping |

---

## Project structure

```
src/
  app/
    (app)/            signed-in pages (Today, marketing, projects, finance, tasks, settings)
    login/            sign-in page
    print/            print-ready invoice (Save as PDF)
    api/export/       JSON backup download
  actions/            server actions (all mutations; each checks the session)
  data/               server-side queries used by pages
  models/             Mongoose schemas
  components/
    ui/               shadcn-style primitives (button, dialog, select…)
    companies/ projects/ finance/ library/ tasks/ …  feature components
  lib/                constants, formatting, finance maths, normalisation, auth
  proxy.ts            redirects signed-out visitors to /login
docs/SCOPE.md         product scope and roadmap
```

## Backups

**Settings → Download all data (JSON)** gives you a full export of every
collection. Atlas also keeps its own snapshots on paid tiers.

## The old project

The previous Next.js + Supabase + Stripe code is kept in git history (commit
`36f1903` and everything before it on `main`).
