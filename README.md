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

## Istemal ka tareeqa (How to use)

### 1. Pehli dafa — Settings
Login ke baad left side neeche **Settings** kholein:

- **Your business:** business ka naam, apna naam, email, phone. Ye invoices aur templates me khud aate hain.
- **Defaults:** apni currency (EUR, USD, PKR…) aur follow-up kitne din baad yaad dilaye.
- **Invoices:** number ka prefix (jaise `INV-`) aur bank / Wise / PayPal ki details.
- **Save settings** dabayein. Dark / light mode yahin se, ya upar ☀️ icon se.

### 2. Nayi company add karna — Client hunting
1. **Client hunting** → **Add company**.
2. Naam ya website likhte hi app check karti hai. Company pehle se ho to wahi dikha deti hai; wahi website dobara add nahi hoti.
3. Country, type, priority (A/B/C) aur opportunity (3D Configurator, OMS…) bhar kar save karein.

List me upar ke tabs se filter karein: **Priority A**, **Ready to contact**, **Contacted**, **In talks**,
**Follow-up due**, **Clients**, **Lost / not a fit**. A–Z harf dabane se us harf ki companies aati hain.
Daayein wala icon board (kanban) view kholta hai.

### 3. Company ka page
- **Research:** checklist tick karein. Sab tick ho jaye to status khud **Ready to contact** ho jata hai.
- **Configurator analysis:** configurator hai ya nahi, aur us me kya kami hai — yahi aap ki pitch hai.
- **People → Add person:** banda, role, LinkedIn, email, phone. Decision-maker par nishan lagayein.
- **Notes:** khud save hote hain.
- **Next follow-up:** kab dobara rabta karna hai.

### 4. Outreach log karna (sab se zaroori)
Jab bhi kisi ko message karein, company page par **Log outreach**:

- **Channel:** LinkedIn connect / message, Email, WhatsApp, Call, Website form, Meeting.
- **Type:** Intro, Proposal, Demo, Follow-up, Reply, Meeting, Note.
- **Result:** No reply yet, Seen, Replied, Interested, Meeting booked, Not interested, Bounced.
- **Next follow-up:** 3 din, 1 hafta, 2 hafte…

Status khud aage badhta hai: Contacted → Replied → Interested → Proposal. **Won**, **Lost** aur **Not a fit**
aap khud lagate hain. Unhi bande ko usi channel par dobara message karein to app bata deti hai ke pehle bhi kar
chuke hain.

### 5. Roz ka kaam — Today aur Follow-ups
- **Today:** aaj ke follow-ups, "going cold" companies (message gaya, jawab nahi, follow-up set nahi), aaj ke
  tasks, aane wale paise aur pipeline.
- **Follow-ups:** har row par ✓ = kaam ho gaya, ⏰ = **Snooze** (baad me yaad dilao).

### 6. Message templates
**Message templates → Add starter templates** se 5 tayyar messages aate hain:

| Template | Kahan | Kab |
| --- | --- | --- |
| LinkedIn connection note | LinkedIn connect | Pehli connection request ke saath |
| LinkedIn proposal | LinkedIn message | Connect hone ke baad pitch |
| Email proposal | Email (subject ke saath) | Email se pitch |
| Friendly follow-up | LinkedIn message | Jawab na aaye to |
| Demo share | Email | Demo ka link bhejna |

Template me ye jaghein khud bharti hain:

| Jagah | Kya aata hai |
| --- | --- |
| `{{firstName}}`, `{{fullName}}`, `{{role}}` | Jis bande ko bhej rahe hain |
| `{{company}}`, `{{country}}`, `{{website}}` | Company ki details |
| `{{weakness}}` | Company page → Configurator analysis me likhi kami |
| `{{opportunity}}` | Jo aap bana kar de sakte hain (3D Configurator, OMS…) |
| `{{myName}}`, `{{myBusiness}}` | Settings me aap ka naam aur business |

Koi cheez company me bhari na ho to `{{...}}` hi dikhta hai aur neeche "Missing" likha aata hai, taake bhejne se
pehle bhar lein.

**Istemal:** company page → **Use template** → banda aur template chunein → **Copy** (ya **Open in email app** /
**Open LinkedIn**) → bhej dein → **Log as sent**. Outreach history me khud likha jata hai ke kaunsa template gaya,
aur **Insights** me dikhta hai ke kis template par zyada jawab aate hain.

Templates ko **Edit** karke apne alfaaz me likhein, **Duplicate** se ek jaisa naya banayein (masalan German
companies ke liye), ya **New template** se bilkul naya.

### 7. Demo library aur Insights
- **Demo library → Add demo:** apne demo links rakhein. Har demo ke saath dikhta hai ke kis company ko bheja.
  Outreach log karte waqt Type "Demo" chunein aur demo select karein.
- **Insights:** har hafte kitni outreach hui (channel ke hisaab se), pipeline, kis channel aur template par zyada
  jawab aate hain, top countries.

### 8. Notion ka data laana — Import CSV
1. Notion me **Export → CSV**.
2. App me **Import CSV** → file daalein ya text paste karke **Read pasted text**.
3. App columns khud milati hai aur duplicates check karti hai. Jo company pehle se ho, us me data merge ho jata hai.

### 9. Client aur project
Deal pakki ho jaye to company page par **New project** (ya upar **+ New → Project**). Company khud
**Won · Client** ban jati hai.

- **Billing:** **One-time build** (poora project) ya **Monthly service** (har mahine ki fees + billing day).
- **Scope:** kya banana hai (**Deliverable**) aur kya shamil nahi (**Not included**). Kaam hote hi tick karein.
- **Milestones:** har qist ki raqam aur tareekh. Kaam ho jaye to tick karein.
- **Payment received / Record payment:** paise aayein to record karein; kis milestone ke hain wo bhi chunein.
- **Timeline:** start se deadline tak progress aur milestones.
- **Links** (staging, Figma), **Tasks** aur **Notes** bhi isi page par.

### 10. Monthly services
Har monthly client ke 12 mahine ka grid: paid, is mahine due, late. Kisi mahine par click karke us mahine ki payment
record kar dein. Upar MRR (har mahine ki fixed aamdani) dikhti hai.

### 11. Invoices
1. Project page par **Invoice**, ya **Invoices → New invoice**.
2. **Add line** se lines daalein, ya **Add milestone** se project ka milestone line ban jata hai. Tax aur discount
   bhi daal sakte hain.
3. **Print / PDF** → browser me "Save as PDF" karke client ko bhejein.
4. Bhejne par **Mark sent**, paise aane par **Mark paid** — payment khud record ho jati hai aur milestone paid ban
   jata hai.

Due date guzar jaye to invoice laal **Overdue** dikhata hai. Galti ho to **Back to draft** ya **Cancel invoice**.

### 12. Finance aur Tasks
- **Finance → Overview:** har mahine ki aamdani, pending, MRR, top clients. **Payments:** saari payments ki list.
- **Tasks → New task:** company ya project se jod sakte hain. Overdue, aaj, aane wale aur done alag dikhte hain.

Har currency ka hisaab alag rehta hai — app EUR ko USD me convert nahi karti.

### Shortcuts
- **Ctrl + K** — har cheez dhoondein: company, banda, email, project.
- Upar **+ New** — kahin se bhi company, project, task, payment ya invoice add karein.
- **Settings → Download all data (JSON)** — poora backup. Mahine me ek dafa le liya karein.

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
