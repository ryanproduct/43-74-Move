-- 0004_profiles_email_daily.sql
-- Move HQ — per-user toggle for the 7am daily summary email.
--
-- Adds `email_daily boolean` to `profiles` with a default of `true`. Existing
-- rows (Ryan, Eleanor) are backfilled to `true` automatically by the column
-- default, so no separate UPDATE is required.
--
-- Apply with the Supabase CLI: `supabase db push`.

begin;

alter table profiles
  add column email_daily boolean not null default true;

commit;
