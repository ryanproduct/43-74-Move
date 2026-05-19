-- 0003_storage_attachments.sql
-- Move HQ — private Supabase Storage bucket for file attachments.
--
-- Creates the `attachments` bucket (private, signed URLs only) and the
-- household-members RLS policies on storage.objects per PLAN.md section 6.
-- Path scheme used by the app: `<parent_type>/<parent_id>/<uuid>-<filename>`,
-- e.g. `task/abc-123/9f0e-quote.pdf`.
--
-- Apply with the Supabase CLI: `supabase db push`.

begin;

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS policies on storage.objects
-- ---------------------------------------------------------------------------
-- Same gate as the rest of the app: the authenticated user must have a row
-- in `public.profiles`. Scoped to bucket_id = 'attachments' so other buckets
-- (if any are added later) are unaffected.

drop policy if exists "household members can read attachments"
  on storage.objects;
drop policy if exists "household members can write attachments"
  on storage.objects;
drop policy if exists "household members can update attachments"
  on storage.objects;
drop policy if exists "household members can delete attachments"
  on storage.objects;

create policy "household members can read attachments"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and auth.uid() in (select id from public.profiles)
  );

create policy "household members can write attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and auth.uid() in (select id from public.profiles)
  );

create policy "household members can update attachments"
  on storage.objects for update
  using (
    bucket_id = 'attachments'
    and auth.uid() in (select id from public.profiles)
  );

create policy "household members can delete attachments"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and auth.uid() in (select id from public.profiles)
  );

commit;
