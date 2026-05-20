# Move 43-74

Private household web app for **Ryan & Eleanor** to manage the move from **43 Hogarth Hill → 74 Addison Way**, hidden behind a magic-link allowlist on `move.productwins.co`.

The single source of truth for the product spec, data model, RLS policies, and prompt sequence is **[../PLAN.md](../PLAN.md)** (one level up from this app folder).

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript
- Tailwind CSS v4 + shadcn/ui (new-york style, neutral base)
- Supabase (Postgres, Auth, Storage, Realtime) via `@supabase/ssr`
- Vercel (hosting + cron) and Postmark (daily summary email)
- `sonner` for toast notifications
- Hand-rolled minimal service worker for PWA installability

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in real values from Supabase / Postmark
npm run dev                        # http://localhost:3000
```

To regenerate app icons from the SVG source:

```bash
brew install librsvg               # one-time
node scripts/make-icons.mjs        # rasterizes public/icons/move-hq-icon.svg → icon-{192,512}.png
```

## Environment variables

All values are placeholders in [`.env.local.example`](.env.local.example) — fill them in from your Supabase project, Postmark server, and Vercel project. The deploy uses the same set.

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for privileged ops |
| `POSTMARK_SERVER_TOKEN` | Postmark Server API token |
| `POSTMARK_FROM_EMAIL` | Sender for the daily email (`hq@productwins.co`) |
| `CRON_SECRET` | Shared secret for the Vercel cron daily-email route |
| `ALLOWED_EMAIL_1` | Ryan's gmail (magic-link allowlist) |
| `ALLOWED_EMAIL_2` | Eleanor's gmail (magic-link allowlist) |
| `APP_URL` | Canonical app URL (`https://move.productwins.co`) |

## Database migrations

Migrations live in [`supabase/migrations/`](./supabase/migrations) — 0001 (schema), 0002 (activity triggers), 0003 (storage `attachments` bucket + RLS), 0004 (`profiles.email_daily`). Seed data is in [`supabase/seed.sql`](./supabase/seed.sql). See [`supabase/README.md`](./supabase/README.md) for the full apply / seed walk-through.

First-time setup on a fresh Supabase project:

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # applies all migrations in order
psql ... -f supabase/seed.sql   # OR run via the Supabase SQL editor
```

## Deploy (Vercel)

1. Connect the GitHub repo to Vercel.
2. In the Vercel project settings, set the same env vars from the table above (`APP_URL` should be the production URL, e.g. `https://move.productwins.co`).
3. Push to `main` → Vercel auto-deploys.
4. `vercel.json` declares the daily-email cron at `0 6 * * *` UTC (07:00 BST — the move window is entirely within BST, so no DST handling needed for v1).
5. Point `move.productwins.co` at Vercel via a CNAME to `cname.vercel-dns.com`. Vercel issues the SSL cert automatically.

## Manual one-time steps

Before either user can log in:

1. **Create the two auth users** in the Supabase dashboard → Authentication → Users → "Add user" for `ryanjude@gmail.com` and `eleanor.oneill@gmail.com`. Use "Send invite" or just create with no password (magic-link only).
2. **Insert the corresponding `profiles` rows** by running the overwrite SQL block in [`supabase/README.md`](./supabase/README.md) — Ryan with `avatar_color: coral-500`, Eleanor with `avatar_color: sky-500`. The schema auto-creates a `profiles` row when a user signs up, but the seed step is where the display name + colour are dialled in.
3. **Configure Postmark**: in your Postmark server, verify either a sender signature for `hq@productwins.co` or the whole `productwins.co` domain (DKIM + Return-Path). Capture the Server API Token into `POSTMARK_SERVER_TOKEN`.
4. **Set the Vercel cron secret** — generate a random string, put it in both `CRON_SECRET` (Vercel env vars) and the `Authorization: Bearer ...` header that Vercel Cron sends. Vercel handles this automatically once the env var is set; you don't need to do anything else.

## PWA install

Move 43-74 ships a minimal manifest + service worker so the dashboard installs to the home screen.

- **iOS Safari**: Share → "Add to Home Screen".
- **Android Chrome**: tap the address-bar menu → "Install app" (or wait for the install prompt).
- **Desktop Chrome / Edge**: the install icon appears in the address bar on `move.productwins.co`.

The icons at [`public/icons/icon-192.png`](./public/icons/icon-192.png) and [`public/icons/icon-512.png`](./public/icons/icon-512.png) are rasterized from [`public/icons/move-hq-icon.svg`](./public/icons/move-hq-icon.svg) (the canonical source: two keys, one coral and one sky-blue, on a warm clay background — one key per user). To redesign, edit the SVG and re-run `node scripts/make-icons.mjs`, then bump the `CACHE` version in [`public/sw.js`](./public/sw.js) so installed PWA clients pick up the new icons on their next service-worker update.

## Project structure

```
app/
├── src/
│   ├── app/
│   │   ├── (app)/              # Auth-gated routes (sidebar + tab bar shell)
│   │   │   ├── _components/    # Dashboard widgets
│   │   │   ├── page.tsx        # / — dashboard
│   │   │   ├── loading.tsx     # Skeleton dashboard
│   │   │   ├── error.tsx       # Per-route error boundary
│   │   │   ├── tasks/          # /tasks, /tasks/[id]
│   │   │   ├── utilities/      # /utilities, /utilities/[id]
│   │   │   ├── contractors/    # /contractors, /contractors/[id]
│   │   │   ├── projects/       # /projects, /projects/[id]
│   │   │   ├── inventory/      # /inventory
│   │   │   └── settings/       # /settings
│   │   ├── (auth)/             # /login (public)
│   │   ├── api/cron/           # /api/cron/daily-summary
│   │   ├── auth/callback/      # Magic-link exchange
│   │   ├── global-error.tsx    # Root-layout fallback
│   │   ├── layout.tsx          # Manifest, theme-color, fonts
│   │   └── globals.css
│   ├── components/             # Shared cross-feature components
│   │   ├── ui/                 # shadcn primitives + sonner Toaster + skeleton
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/           # browser / server / middleware / service clients
│   │   ├── tasks/ utilities/ contractors/ projects/ inventory/ dashboard/
│   │   │                       # Per-feature query + type modules
│   │   └── email/              # Postmark client + daily-summary renderer
│   └── proxy.ts                # Next 16 Proxy — refreshes Supabase session
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Minimal offline app-shell SW
│   └── icons/                  # PWA icons (regenerate via scripts/)
├── scripts/
│   └── make-icons.mjs          # One-off PNG icon generator (no deps)
├── supabase/
│   ├── migrations/             # 0001 schema · 0002 triggers · 0003 email_daily · …
│   ├── seed.sql                # Starter tasks / utilities / projects / rooms
│   └── README.md               # Apply + seed walk-through
├── design-references/          # Static HTML refs for dashboard + contractor detail
├── vercel.json                 # Cron schedule for /api/cron/daily-summary
└── package.json
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server with HMR |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next + TypeScript + Prettier-compatible) |
| `node scripts/make-icons.mjs` | Regenerate PWA icons |
