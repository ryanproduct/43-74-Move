-- 0007_profiles_has_logged_in_before.sql
--
-- Track whether a profile has completed at least one sign-in. The dashboard
-- uses this to fire the "welcome to Move 43-74" confetti exactly once per
-- user, on their first visit. Defaulting to false means every newly created
-- profile (i.e. Eleanor on her first sign-in) gets the welcome treatment;
-- the backfill below ensures anyone who already has a sign-in history
-- (Ryan) does NOT see the welcome on their next refresh.

alter table public.profiles
  add column if not exists has_logged_in_before boolean not null default false;

update public.profiles p
   set has_logged_in_before = true
  from auth.users u
 where p.id = u.id
   and u.last_sign_in_at is not null;
