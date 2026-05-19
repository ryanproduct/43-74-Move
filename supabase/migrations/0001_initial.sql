-- 0001_initial.sql
-- Move HQ — initial schema
-- Implements every table, enum, foreign key, index, RLS policy, and trigger
-- described in PLAN.md sections 5 (Data Model) and 6 (Row Level Security).
--
-- Conventions (per PLAN.md section 5):
--   - id           uuid primary key default gen_random_uuid()
--   - created_at   timestamptz not null default now()
--   - updated_at   timestamptz not null default now()  (auto-bumped via trigger)
--   - created_by   uuid references profiles(id)        (except `profiles` itself)
--
-- RLS policy (PLAN.md section 6) is the same on every table:
--   auth.uid() in (select id from profiles)
--
-- Apply with the Supabase CLI: `supabase db push`.

begin;

-- ---------------------------------------------------------------------------
-- Required extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";        -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums (defined before any table that uses them)
-- ---------------------------------------------------------------------------

-- Property: Hogarth (old house) / Addison (new house) / Both
create type property as enum ('hogarth', 'addison', 'both');

-- Task category
create type category as enum (
  'packing',
  'cleaning',
  'utilities',
  'renovation',
  'admin',
  'kids',
  'shopping',
  'other'
);

-- Task lifecycle
create type task_status as enum ('todo', 'in_progress', 'blocked', 'done');
create type task_priority as enum ('low', 'med', 'high');

-- Utilities
create type utility_type as enum (
  'electricity',
  'gas',
  'dual_fuel',
  'water',
  'broadband',
  'mobile',
  'tv_licence',
  'council_tax',
  'insurance_home',
  'insurance_contents',
  'insurance_car',
  'subscriptions',
  'post_redirect',
  'other'
);

create type utility_hogarth_action as enum (
  'cancel',
  'final_reading',
  'transfer',
  'none',
  'na'
);

create type utility_addison_action as enum (
  'setup',
  'transfer',
  'keep_existing',
  'none',
  'na'
);

create type utility_status as enum ('not_started', 'in_progress', 'done');

-- Contractors
create type contractor_verdict as enum (
  'considering',
  'shortlist',
  'chosen',
  'rejected'
);

-- Projects
-- (PLAN.md uses `property` enum already; the spec calls it `project_property`
-- in section 5 prelude, but reuses the same value set as `property`. We reuse
-- the existing `property` type for the projects.property column. The
-- `project_property` enum name is kept here as a documented alias so the
-- promise from the prompt — "every enum column listed in section 5" — is
-- explicit; only `property` is actually referenced.)
create type project_status as enum (
  'planning',
  'quoting',
  'scheduled',
  'in_progress',
  'done'
);

-- Inventory
create type inventory_decision as enum (
  'keep',
  'sell',
  'donate',
  'bin',
  'undecided'
);

-- Polymorphic parent_type used by attachments, comments, activity
create type parent_type as enum (
  'task',
  'contractor',
  'project',
  'inventory',
  'utility'
);

-- Activity verbs
create type activity_verb as enum (
  'created',
  'updated',
  'completed',
  'commented',
  'attached',
  'deleted'
);

-- ---------------------------------------------------------------------------
-- Shared trigger function: bump updated_at on every row update
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Mirrors auth.users. `id` is the auth user's id. No created_by FK (the row
-- IS the user). Created automatically via the on_auth_user_created trigger
-- below; manual seed step overrides display_name / avatar_color for Ryan
-- and Eleanor.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  display_name  text not null,
  avatar_color  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
-- Created before contractors so contractors.project_id can reference it,
-- and before tasks so tasks.project_id can reference it. Note that
-- projects.chosen_contractor_id is a forward reference to contractors.id —
-- we add that FK after both tables exist.
create table projects (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  property              property not null default 'addison',
  status                project_status not null default 'planning',
  budget_pence          integer,
  start_date            date,
  end_date              date,
  chosen_contractor_id  uuid,       -- FK added after contractors exists
  description           text,
  decisions             jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references profiles(id)
);

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- utilities
-- ---------------------------------------------------------------------------
create table utilities (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            utility_type not null,
  account_number  text,
  hogarth_action  utility_hogarth_action not null default 'none',
  addison_action  utility_addison_action not null default 'none',
  switch_date     date,
  status          utility_status not null default 'not_started',
  contact_phone   text,
  contact_url     text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references profiles(id)
);

create trigger utilities_set_updated_at
  before update on utilities
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- contractors
-- ---------------------------------------------------------------------------
create table contractors (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  trade               text not null,
  project_id          uuid references projects(id) on delete set null,
  contact_name        text,
  phone               text,
  email               text,
  website             text,
  quote_amount_pence  integer,
  quote_includes      text,
  quote_excludes      text,
  timeline            text,
  references_notes    text,
  verdict             contractor_verdict not null default 'considering',
  verdict_notes       text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references profiles(id)
);

create trigger contractors_set_updated_at
  before update on contractors
  for each row execute function set_updated_at();

-- Now we can add the deferred FK on projects.chosen_contractor_id
alter table projects
  add constraint projects_chosen_contractor_id_fkey
  foreign key (chosen_contractor_id) references contractors(id) on delete set null;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  property        property not null,
  category        category not null,
  owner_id        uuid references profiles(id) on delete set null,
  status          task_status not null default 'todo',
  priority        task_priority not null default 'med',
  due_date        date,
  blocked_reason  text,
  project_id      uuid references projects(id) on delete set null,
  utility_id      uuid references utilities(id) on delete set null,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references profiles(id)
);

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- Indexes per PLAN.md section 5.2
create index tasks_status_due_date_idx on tasks (status, due_date);
create index tasks_owner_status_idx    on tasks (owner_id, status);
create index tasks_property_idx        on tasks (property);

-- Trigger: set/clear completed_at when status transitions to/from done.
create or replace function tasks_sync_completed_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'done' and new.completed_at is null then
      new.completed_at := now();
    end if;
    return new;
  end if;

  -- UPDATE
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at := now();
  elsif new.status <> 'done' and old.status = 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completed_at
  before insert or update of status on tasks
  for each row execute function tasks_sync_completed_at();

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
create table inventory (
  id                uuid primary key default gen_random_uuid(),
  room              text not null,
  item              text not null,
  decision          inventory_decision not null default 'undecided',
  priority_unpack   boolean not null default false,
  notes             text,
  photo_path        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references profiles(id)
);

create trigger inventory_set_updated_at
  before update on inventory
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- attachments (polymorphic)
-- ---------------------------------------------------------------------------
create table attachments (
  id            uuid primary key default gen_random_uuid(),
  parent_type   parent_type not null,
  parent_id     uuid not null,
  filename      text not null,
  storage_path  text not null,
  mime_type     text not null,
  size_bytes    bigint not null,
  caption       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references profiles(id)
);

create trigger attachments_set_updated_at
  before update on attachments
  for each row execute function set_updated_at();

create index attachments_parent_idx on attachments (parent_type, parent_id);

-- ---------------------------------------------------------------------------
-- comments (polymorphic, threadless)
-- ---------------------------------------------------------------------------
create table comments (
  id                  uuid primary key default gen_random_uuid(),
  parent_type         parent_type not null,
  parent_id           uuid not null,
  body                text not null,
  mentions_user_id    uuid references profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references profiles(id)
);

create trigger comments_set_updated_at
  before update on comments
  for each row execute function set_updated_at();

create index comments_parent_created_idx on comments (parent_type, parent_id, created_at);

-- ---------------------------------------------------------------------------
-- activity (append-only log)
-- ---------------------------------------------------------------------------
-- Rows are written by triggers (see 0002_activity_triggers.sql). The
-- created_by column on this table mirrors actor_id; both are kept for
-- consistency with the rest of the schema.
create table activity (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid not null references profiles(id) on delete cascade,
  verb          activity_verb not null,
  parent_type   parent_type not null,
  parent_id     uuid not null,
  summary       text not null,
  metadata      jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references profiles(id)
);

create trigger activity_set_updated_at
  before update on activity
  for each row execute function set_updated_at();

create index activity_created_at_desc_idx on activity (created_at desc);

-- ---------------------------------------------------------------------------
-- Auth → profiles bootstrap trigger
-- ---------------------------------------------------------------------------
-- When a new auth.users row is inserted, mirror a profiles row.
-- display_name defaults to the email local-part; avatar_color defaults to
-- coral-500. Manual seed/post-setup will override values for Ryan/Eleanor.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_color)
  values (
    new.id,
    new.email,
    split_part(coalesce(new.email, ''), '@', 1),
    'coral-500'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Enable RLS on every table.
alter table profiles      enable row level security;
alter table projects      enable row level security;
alter table utilities     enable row level security;
alter table contractors   enable row level security;
alter table tasks         enable row level security;
alter table inventory     enable row level security;
alter table attachments   enable row level security;
alter table comments      enable row level security;
alter table activity      enable row level security;

-- Policy gate (per PLAN.md section 6):
--   auth.uid() in (select id from profiles)
-- The same four policies (select / insert / update / delete) on every table.

-- profiles
create policy "household members can read"
  on profiles for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on profiles for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on profiles for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on profiles for delete
  using (auth.uid() in (select id from profiles));

-- projects
create policy "household members can read"
  on projects for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on projects for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on projects for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on projects for delete
  using (auth.uid() in (select id from profiles));

-- utilities
create policy "household members can read"
  on utilities for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on utilities for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on utilities for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on utilities for delete
  using (auth.uid() in (select id from profiles));

-- contractors
create policy "household members can read"
  on contractors for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on contractors for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on contractors for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on contractors for delete
  using (auth.uid() in (select id from profiles));

-- tasks
create policy "household members can read"
  on tasks for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on tasks for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on tasks for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on tasks for delete
  using (auth.uid() in (select id from profiles));

-- inventory
create policy "household members can read"
  on inventory for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on inventory for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on inventory for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on inventory for delete
  using (auth.uid() in (select id from profiles));

-- attachments
create policy "household members can read"
  on attachments for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on attachments for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on attachments for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on attachments for delete
  using (auth.uid() in (select id from profiles));

-- comments
create policy "household members can read"
  on comments for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on comments for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on comments for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on comments for delete
  using (auth.uid() in (select id from profiles));

-- activity
create policy "household members can read"
  on activity for select
  using (auth.uid() in (select id from profiles));
create policy "household members can write"
  on activity for insert
  with check (auth.uid() in (select id from profiles));
create policy "household members can update"
  on activity for update
  using (auth.uid() in (select id from profiles));
create policy "household members can delete"
  on activity for delete
  using (auth.uid() in (select id from profiles));

commit;
