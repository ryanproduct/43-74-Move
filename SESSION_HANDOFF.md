# Move 43-74 — Session handoff

Snapshot at 2026-05-20 EOD. Read this first when resuming in a new
session — it covers what's live, what's pending, and where everything
lives. The product spec is still at [../PLAN.md](../PLAN.md); this file
captures everything that happened in execution.

---

## What's live right now

| | |
| --- | --- |
| **Production URL** | <https://move.productwins.co> (Vercel auto-issues SSL, CNAME → `cname.vercel-dns.com`) |
| **Backup URL** | <https://move-hq.vercel.app> (same project, also reachable) |
| **Latest deployed commit** | `c855649` (`feat(dashboard): property photos as countdown card backgrounds`) |
| **GitHub repo** | <https://github.com/ryanproduct/43-74-Move> (private, `main` branch) |
| **Vercel project** | `move-hq` under team `ryan-8025s-projects` (project id `prj_Jxo5hQCIXqZjAXcJJt3qRFeh81Xo`) |
| **Supabase project** | "Move 43-74" / ref `ucjuwlkcpfadbzbhrzsv`, region `eu-west-1` |
| **GitHub→Vercel auto-deploy** | Connected. Push to `main` = production deploy. CLI `vercel --prod` also works. |
| **Vercel cron** | `/api/cron/daily-summary` at `0 6 * * *` UTC (07:00 BST) |

**Working tree state:** clean and pushed. Nothing in-flight.

---

## What Eleanor will experience on her first sign-in

1. Ryan clicks **"Send sign-in link to Eleanor"** on `/settings` (or runs
   `node scripts/send-preview-magic-link.mjs eleanor.oneill@gmail.com`
   from local with the right env vars).
2. She receives the customised magic-link email — clay/linen design,
   eyebrow "Move 43-74 · From Ryan", body opening "Ryan put this
   together for the two of you…", signed "— Ryan". Subject:
   **"Sign in to Move 43-74"**. Source-of-truth file:
   [supabase/email-templates/magic-link.html](./supabase/email-templates/magic-link.html).
   Sender currently appears as **"Supabase Auth"** — will become
   **"Ryan from Move 43-74 <ryan@productwins.co>"** once we run the
   custom SMTP script (see "Outstanding" below).
3. Magic link routes her to `/auth/callback` → dashboard.
4. The dashboard atomically flips `profiles.has_logged_in_before` from
   false→true and fires the welcome:
   - 80-particle confetti burst from screen centre
   - ~2.5s of side-bursts from the bottom corners
   - Sonner toast: *"Welcome to Move 43-74, Eleanor 🎉 — Everything for
     the move lives here. Tap around — you can't break anything."*
5. Confetti fires exactly once, ever. Refresh = nothing happens.

---

## Outstanding (only one thing is genuinely blocked)

### Postmark account approval → SMTP swap

**Status:** awaiting Postmark approval. Until then, Postmark refuses to
deliver to gmail addresses (account-pending restriction; can only send
to `*@productwins.co`).

**What it blocks:**
- The 07:00 BST daily summary email won't deliver to either gmail
  address. Cron is wired up; everything works except the final send.
- The invite email's From header still says "Supabase Auth"
  (functionally fine, aesthetically meh).

**What to do when approval lands:**

```bash
cd "/Users/ryansoosayraj/Documents/ProductWins/43-74 Move/app"
SUPABASE_ACCESS_TOKEN=sbp_… \
  node scripts/configure-supabase-smtp.mjs
```

That reads `POSTMARK_SERVER_TOKEN` + `POSTMARK_FROM_EMAIL` from
`.env.local`, defaults sender name to `"Ryan from Move 43-74"`, and
PATCHes Supabase Auth to route every magic-link email through
Postmark. Next sign-in email arrives from
`Ryan from Move 43-74 <ryan@productwins.co>`. Verify with
`scripts/send-preview-magic-link.mjs ryanjude@gmail.com`.

---

## Repo layout (the parts that matter)

```
app/
├── src/
│   ├── app/
│   │   ├── (app)/                    Auth-gated routes (sidebar + tab bar shell)
│   │   │   ├── _components/          Dashboard widgets + FirstLoginWelcome
│   │   │   ├── page.tsx              / — dashboard (countdowns w/ property photos)
│   │   │   ├── tasks/                List, [id] detail, EditTaskButton, kanban, realtime
│   │   │   ├── utilities/            Table w/ inline edits, [id] detail
│   │   │   ├── projects/             Cards, decisions log, [id] detail
│   │   │   ├── contractors/          Groupable list, [id] (follows design ref)
│   │   │   ├── inventory/            Rooms grouping, inline edits, photo upload
│   │   │   └── settings/             Display name + avatar + email_daily + invite
│   │   ├── (auth)/login/             Magic-link form (public)
│   │   ├── api/cron/daily-summary/   Vercel cron handler
│   │   └── auth/callback/            Magic-link exchange
│   ├── components/                   Shared cross-feature (TaskCard, Markdown, etc.)
│   │   └── ui/                       shadcn new-york primitives + sonner + skeleton
│   ├── lib/
│   │   ├── supabase/                 browser / server / middleware / service clients
│   │   ├── tasks/ utilities/ projects/ contractors/ inventory/ dashboard/
│   │   └── email/                    Postmark + daily-summary renderer
│   └── proxy.ts                      Next 16 Proxy — refreshes session, gates routes
├── public/
│   ├── icons/                        PWA icons + canonical SVG
│   ├── images/                       43-hogarth-hill.jpg, 74-addison-way.jpg
│   ├── manifest.json
│   └── sw.js                         Offline app-shell SW
├── scripts/
│   ├── make-icons.mjs                rsvg-convert SVG → 192/512 PNGs
│   ├── send-preview-magic-link.mjs   Trigger a real magic-link to any allowlisted email
│   └── configure-supabase-smtp.mjs   ⚠️ Run after Postmark approval
├── supabase/
│   ├── migrations/                   0001 schema · 0002 triggers · 0003 storage
│   │                                 0004 email_daily · 0005 RLS recursion fix
│   │                                 0006 tasks.contractor_id · 0007 has_logged_in_before
│   ├── email-templates/              magic-link.html (source of truth for Supabase template)
│   ├── seed.sql                      Starter rows
│   └── README.md                     Apply / seed walk-through
├── design-references/                dashboard.html, contractor-detail.html (vendored HTML)
├── vercel.json                       Cron schedule
└── package.json
```

---

## Database state

**Migrations applied (all on prod):** 0001 through 0007.

**Auth users:** Ryan (`ryanjude@gmail.com`) and Eleanor
(`eleanor.oneill@gmail.com`). Both auto-confirmed.

**Profiles:**
- Ryan: `display_name="Ryan"`, `avatar_color="coral-500"`,
  `email_daily=true`, `has_logged_in_before=true`
- Eleanor: `display_name="Eleanor"`, `avatar_color="sky-500"`,
  `email_daily=true`, **`has_logged_in_before=false`** (← confetti
  waiting)

**Seeded rows:** 27 tasks · 15 utilities · 1 project (Bathroom) · 10
inventory rooms · 0 contractors

**Realtime publication:** `tasks`, `comments`, `attachments`, `activity`,
`utilities`, `projects`, `contractors`, `inventory` all added to
`supabase_realtime`.

**Storage:** private `attachments` bucket with household-only RLS
(uploaded files use signed URLs valid 1h).

**Auth config (Supabase):**
- Site URL: `https://move.productwins.co`
- Redirect allow list: prod + `move-hq.vercel.app` + `*.vercel.app` +
  `localhost:3000`
- Magic-link template + subject overridden (custom HTML)
- Custom SMTP: **not configured yet** (Postmark approval pending)

---

## Where credentials live (don't write them here)

| Secret | Location |
| --- | --- |
| Supabase URL + anon + service-role | `.env.local` (gitignored), Vercel env vars (production scope) |
| Supabase database password | password manager only |
| Supabase Personal Access Token (`SUPABASE_ACCESS_TOKEN`) | password manager — needed for any management-API call (e.g. the SMTP script) |
| Postmark Server API Token | `.env.local`, Vercel env (`POSTMARK_SERVER_TOKEN`) |
| Vercel CLI token | password manager — used in this session as `--token=…` for CLI commands |
| `CRON_SECRET` | `.env.local`, Vercel env (generated `openssl rand -hex 32`) |

`.env.local` is gitignored; never committed. If a new session needs to
run commands, ask Ryan to paste the relevant value or run the command
himself.

---

## Useful commands

```bash
cd "/Users/ryansoosayraj/Documents/ProductWins/43-74 Move/app"

# Local dev
npm run dev                                 # http://localhost:3000
npm run lint
npm run build

# Apply a new migration to prod (after the user confirms)
/opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres.ucjuwlkcpfadbzbhrzsv:<DB-PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/<file>.sql

# Send a real magic-link email for preview (no session impact)
SUPABASE_ANON_KEY=<…> node scripts/send-preview-magic-link.mjs <email>

# Trigger the daily cron manually
curl -H "Authorization: Bearer <CRON_SECRET>" https://move.productwins.co/api/cron/daily-summary

# Push the magic-link email template to Supabase after editing it
# (PATCH /v1/projects/<ref>/config/auth with mailer_templates_magic_link_content)

# Deploy
vercel --prod --yes --token=<…>             # or just push to main
```

---

## What got built this session (newest first)

| Commit | What |
| --- | --- |
| `c855649` | Property photos as countdown card backgrounds (paper-gradient overlay) |
| `b1a1b20` | Confetti + welcome toast on Eleanor's first sign-in (one-shot, atomic) |
| `dadb764` | Pre-staged SMTP-configure script for when Postmark approves |
| `929ef0d` | Preview magic-link script for testing the invite email |
| `b35abee` | Rename "Move HQ" → "Move 43-74" everywhere + invite email gets icon + signed "— Ryan" |
| `ddf00be` | Invite-other-household-member card on /settings (uses Supabase signInWithOtp + custom HTML template) |
| `63820b7` | Optional contractor link on tasks (migration 0006) |
| `cf1a311` | Edit modal on Task and Utility detail pages (Projects + Contractors already had them) |
| `ff0e49d` | Fix infinite RLS recursion on profiles policy (migration 0005) — was causing blank lists + "infinite recursion" errors |
| `462acb6` | Proxy was gating /manifest.json and /sw.js — would have broken PWA install |
| `62a8948` | Two-key Move 43-74 icon (designed in Claude Design, rasterised from SVG) |
| `191bd69` | Proxy was gating /api/* routes (broke cron) |
| `aed2bec` | vercel.json had invalid `description` field in cron entry — first deploy failed |
| `1620845` | README migration numbering fix |
| `803ebcb` | Prompt 8: PWA manifest + service worker + loading.tsx + error.tsx + sonner toasts + mobile pass |
| `647fa55` | Prompt 7 merge: daily email cron + Postmark + email_daily toggle |
| `00ea50f` | Prompt 6 merge: dashboard widgets (live, follows design ref) |
| `00397e0` `9f14f50` `c4f2423` `2f4460b` | Prompt 5 merges: contractors, projects, inventory, utilities |
| `b1efb57` | Pre-staged shadcn primitives (card / badge / table / tabs / checkbox) so the 4 parallel agents wouldn't conflict |
| `7a4510a` | Prompt 4: Tasks end-to-end (realtime, comments, attachments, kanban) |
| `3746697` | Vendored design-references HTML files |
| `e7973a0` | Prompt 3: Auth + AppShell + proxy gating + /settings |
| `f781e07` | Prompt 2: schema, activity triggers, seed |
| `627da40` | Switched shadcn from base-nova → new-york style; renamed middleware → proxy for Next 16 |
| `1bc7531` | Prompt 1: scaffold (shadcn + Supabase clients + Prettier + env template) |

---

## User preferences captured this session

- **Push to main is the workflow.** Don't open PRs; the GitHub→Vercel
  integration auto-deploys from main. Don't ever force-push, but
  fast-forward commits to main are expected.
- **Migrations require explicit approval** before applying to prod.
  Show the SQL, ask, then run psql.
- **Show before send.** Email templates, copy changes, anything
  user-facing — preview/render before triggering the real action.
- **Concise is preferred** but completeness matters. Tables work well
  for state summaries. Avoid trailing flourishes.
- **Auto-mode classifier is strict.** Scripts in `/tmp` get blocked
  because they're invisible in the transcript. Write tracked files
  in `scripts/` if a one-off tool needs to run.
- **The icon avatar in Gmail (BIMI) is not worth pursuing** for this
  scope. Once SMTP is on Postmark, Eleanor's Gmail will likely show
  Ryan's contact photo anyway.
- **Don't add features for hypothetical needs.** This session added
  edit modals and a contractor field only when requested.

---

## Quick map of "if I want to change X"

| Want to change | File(s) |
| --- | --- |
| The two countdown target dates | [src/app/(app)/page.tsx](./src/app/(app)/page.tsx) — `KEYS_TARGET`, `MOVE_OUT_TARGET` |
| The property photos behind countdowns | [public/images/](./public/images/) — drop replacements at same filenames |
| The magic-link email design | [supabase/email-templates/magic-link.html](./supabase/email-templates/magic-link.html) — then re-PATCH via management API |
| The daily summary email body | [src/lib/email/dailySummary.ts](./src/lib/email/dailySummary.ts) |
| The sidebar nav items | [src/components/SidebarNav.tsx](./src/components/SidebarNav.tsx) |
| The avatar colour palette | [src/app/(app)/settings/constants.ts](./src/app/(app)/settings/constants.ts) + matching CSS vars in [src/app/globals.css](./src/app/globals.css) |
| The allowlist (add a third user) | Vercel env (`ALLOWED_EMAIL_*`), then `auth.signInWithOtp` allowlist gate in [src/app/(auth)/login/](./src/app/(auth)/login/) and the invite action in [src/app/(app)/settings/actions.ts](./src/app/(app)/settings/actions.ts). Also create the auth user via Supabase dashboard + insert the profile row. |
| The dashboard layout | [src/app/(app)/page.tsx](./src/app/(app)/page.tsx) + widget components under `_components/` |
| The shadcn primitive style | [components.json](./components.json) (`style: "new-york"`); changing it requires re-authoring every primitive in `src/components/ui/` |

---

## Resume prompt

When picking this up in a new session, this single line is usually
enough to get oriented:

> "Read SESSION_HANDOFF.md in `/Users/ryansoosayraj/Documents/ProductWins/43-74 Move/app/` to catch up on the Move 43-74 project. Latest deployed commit was `c855649`. Anything I should know about state drift since then?"
