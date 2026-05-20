-- 0005_fix_profiles_rls_recursion.sql
--
-- The original RLS policy on `profiles`
--   using (auth.uid() in (select id from profiles))
-- is self-referential: evaluating the policy queries profiles, which re-runs
-- the same policy, which re-queries profiles, ad infinitum. Postgres aborts
-- with "infinite recursion detected in policy for relation 'profiles'" the
-- moment any other table's policy evaluates `select id from profiles` (which
-- they all do — that subquery is the household-membership gate).
--
-- Fix: profile rows are created exclusively by the handle_new_auth_user
-- trigger (which runs SECURITY DEFINER and bypasses RLS) and can only be
-- mutated by their owner. It is safe to let any authenticated user read all
-- profile rows — the app needs that anyway to show owner names / avatars on
-- shared records. The household-membership gate on other tables still holds:
-- `auth.uid() in (select id from profiles)` is true iff the current user has
-- a row, i.e. iff they signed in through the allowlist.

begin;

drop policy if exists "household members can read" on public.profiles;
drop policy if exists "household members can write" on public.profiles;
drop policy if exists "household members can update" on public.profiles;
drop policy if exists "household members can delete" on public.profiles;

create policy "authenticated can read profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "self can update profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy: rows arrive via the handle_new_auth_user trigger.
-- No DELETE policy: profile rows persist with the underlying auth user.

commit;
