-- 0006_tasks_contractor_id.sql
--
-- Add an optional contractor link to tasks. Mirrors the existing
-- project_id / utility_id columns: nullable FK with ON DELETE SET NULL so
-- removing a contractor doesn't cascade-delete tasks. Partial index for
-- "tasks attached to a contractor" lookups.

alter table public.tasks
  add column if not exists contractor_id uuid
    references public.contractors(id) on delete set null;

create index if not exists idx_tasks_contractor_id
  on public.tasks(contractor_id)
  where contractor_id is not null;
