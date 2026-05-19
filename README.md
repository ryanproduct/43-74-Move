# Move HQ

Private household web app for **Ryan & Eleanor** to manage the move from **43 Hogarth Hill → 74 Addison Way**. Hidden behind a magic-link allowlist on `move.productwins.co`.

See [PLAN.md](../PLAN.md) (one level up from this app folder) for the full product spec, data model, RLS policies, and prompt sequence.

## Stack

- Next.js 16 (App Router), TypeScript
- Tailwind CSS v4, shadcn/ui (new-york style, neutral base)
- Supabase (Postgres, Auth, Storage, Realtime) via `@supabase/ssr`
- Vercel for hosting and cron
- Postmark for the daily summary email

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in values from Supabase/Postmark
npm run dev
```

The app runs at <http://localhost:3000>.

## Environment variables

All required values are placeholders in [`.env.local.example`](.env.local.example):

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
| `APP_URL` | Canonical app URL (e.g. `https://move.productwins.co`) |

## Repo layout (after Prompt 1)

```
app/
├── src/
│   ├── app/                    # Next.js App Router (currently just /)
│   ├── components/ui/          # shadcn primitives
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server (RSC / route handler) client
│   │   │   └── middleware.ts   # Cookie-refreshing client for middleware
│   │   └── utils.ts            # cn() helper
│   └── proxy.ts                # Next 16 Proxy — refreshes supabase session
├── .env.local.example
├── components.json             # shadcn/ui config
├── eslint.config.mjs
├── .prettierrc
└── package.json
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next + TypeScript + Prettier-compatible) |
