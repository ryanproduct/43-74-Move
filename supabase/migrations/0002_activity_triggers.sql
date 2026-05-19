-- 0002_activity_triggers.sql
-- Move HQ — activity log triggers
--
-- For each source table (tasks, contractors, projects, utilities, inventory,
-- comments, attachments) this migration installs after-insert / after-update /
-- after-delete triggers that append a row to `activity` with a pre-rendered
-- human-readable `summary`.
--
-- Examples from PLAN.md section 5.9 / section 11:
--   "Ryan added quote to Bathroom Fitter Ltd"
--   "Ryan completed 'Royal Mail redirect'"
--
-- Verbs used here:
--   created    — on INSERT
--   updated    — on UPDATE (when not a completion event)
--   completed  — on UPDATE when tasks.status transitions to 'done'
--   commented  — on INSERT into comments (with verb `created` overridden)
--   attached   — on INSERT into attachments (with verb `created` overridden)
--   deleted    — on DELETE
--
-- Notes
-- -----
-- `actor_id` is auth.uid(). If auth.uid() is null (e.g. a service-role
-- back-end call), the trigger short-circuits and writes nothing — there is no
-- valid actor to attribute, and `activity.actor_id` is not null. Application
-- code is expected to act on behalf of an authenticated user; the seed file
-- bypasses these triggers because seeds run outside of an auth session.
--
-- All triggers are AFTER triggers so they fire only after the row change has
-- successfully landed; failures inside the trigger raise, rolling back the
-- whole statement (deliberate — we'd rather notice a logging bug than silently
-- drift the audit log).

begin;

-- ---------------------------------------------------------------------------
-- helper: resolve the actor's display_name (falls back to email local-part)
-- ---------------------------------------------------------------------------
create or replace function activity_actor_name(p_actor_id uuid)
returns text
language sql
stable
as $$
  select coalesce(p.display_name, split_part(coalesce(p.email, ''), '@', 1), 'Someone')
  from profiles p
  where p.id = p_actor_id;
$$;

-- ===========================================================================
-- tasks
-- ===========================================================================
create or replace function log_activity_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor  uuid := auth.uid();
  v_name   text;
  v_title  text;
begin
  if v_actor is null then
    return coalesce(new, old);
  end if;
  v_name := activity_actor_name(v_actor);

  if tg_op = 'INSERT' then
    v_title := new.title;
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'created',
      'task',
      new.id,
      v_name || ' created task ''' || v_title || '''',
      jsonb_build_object('status', new.status, 'property', new.property),
      v_actor
    );
    return new;

  elsif tg_op = 'UPDATE' then
    v_title := new.title;
    -- Completion is its own verb (status → done)
    if new.status = 'done' and old.status is distinct from 'done' then
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'completed',
        'task',
        new.id,
        v_name || ' completed ''' || v_title || '''',
        jsonb_build_object('from_status', old.status),
        v_actor
      );
    else
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'updated',
        'task',
        new.id,
        v_name || ' updated task ''' || v_title || '''',
        jsonb_build_object('status', new.status),
        v_actor
      );
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    v_title := old.title;
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'deleted',
      'task',
      old.id,
      v_name || ' deleted task ''' || v_title || '''',
      null,
      v_actor
    );
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger tasks_log_activity
  after insert or update or delete on tasks
  for each row execute function log_activity_tasks();

-- ===========================================================================
-- contractors
-- ===========================================================================
create or replace function log_activity_contractors()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_name  text;
begin
  if v_actor is null then
    return coalesce(new, old);
  end if;
  v_name := activity_actor_name(v_actor);

  if tg_op = 'INSERT' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'created',
      'contractor',
      new.id,
      v_name || ' added contractor ' || new.name,
      jsonb_build_object('trade', new.trade, 'verdict', new.verdict),
      v_actor
    );
    return new;

  elsif tg_op = 'UPDATE' then
    -- Special-case: quote was added/updated
    if (old.quote_amount_pence is null and new.quote_amount_pence is not null) then
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'updated',
        'contractor',
        new.id,
        v_name || ' added quote to ' || new.name,
        jsonb_build_object('quote_amount_pence', new.quote_amount_pence),
        v_actor
      );
    elsif (old.verdict is distinct from new.verdict) then
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'updated',
        'contractor',
        new.id,
        v_name || ' set verdict on ' || new.name || ' to ' || new.verdict::text,
        jsonb_build_object('from_verdict', old.verdict, 'to_verdict', new.verdict),
        v_actor
      );
    else
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'updated',
        'contractor',
        new.id,
        v_name || ' updated contractor ' || new.name,
        null,
        v_actor
      );
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'deleted',
      'contractor',
      old.id,
      v_name || ' deleted contractor ' || old.name,
      null,
      v_actor
    );
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger contractors_log_activity
  after insert or update or delete on contractors
  for each row execute function log_activity_contractors();

-- ===========================================================================
-- projects
-- ===========================================================================
create or replace function log_activity_projects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_name  text;
begin
  if v_actor is null then
    return coalesce(new, old);
  end if;
  v_name := activity_actor_name(v_actor);

  if tg_op = 'INSERT' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'created',
      'project',
      new.id,
      v_name || ' created project ''' || new.name || '''',
      jsonb_build_object('status', new.status, 'property', new.property),
      v_actor
    );
    return new;

  elsif tg_op = 'UPDATE' then
    if new.status = 'done' and old.status is distinct from 'done' then
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'completed',
        'project',
        new.id,
        v_name || ' completed project ''' || new.name || '''',
        jsonb_build_object('from_status', old.status),
        v_actor
      );
    else
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'updated',
        'project',
        new.id,
        v_name || ' updated project ''' || new.name || '''',
        null,
        v_actor
      );
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'deleted',
      'project',
      old.id,
      v_name || ' deleted project ''' || old.name || '''',
      null,
      v_actor
    );
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger projects_log_activity
  after insert or update or delete on projects
  for each row execute function log_activity_projects();

-- ===========================================================================
-- utilities
-- ===========================================================================
create or replace function log_activity_utilities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_name  text;
begin
  if v_actor is null then
    return coalesce(new, old);
  end if;
  v_name := activity_actor_name(v_actor);

  if tg_op = 'INSERT' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'created',
      'utility',
      new.id,
      v_name || ' added utility ' || new.name,
      jsonb_build_object('type', new.type, 'status', new.status),
      v_actor
    );
    return new;

  elsif tg_op = 'UPDATE' then
    if new.status = 'done' and old.status is distinct from 'done' then
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'completed',
        'utility',
        new.id,
        v_name || ' completed utility ' || new.name,
        jsonb_build_object('from_status', old.status),
        v_actor
      );
    else
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'updated',
        'utility',
        new.id,
        v_name || ' updated utility ' || new.name,
        null,
        v_actor
      );
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'deleted',
      'utility',
      old.id,
      v_name || ' deleted utility ' || old.name,
      null,
      v_actor
    );
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger utilities_log_activity
  after insert or update or delete on utilities
  for each row execute function log_activity_utilities();

-- ===========================================================================
-- inventory
-- ===========================================================================
create or replace function log_activity_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_name  text;
begin
  if v_actor is null then
    return coalesce(new, old);
  end if;
  v_name := activity_actor_name(v_actor);

  if tg_op = 'INSERT' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'created',
      'inventory',
      new.id,
      v_name || ' added ''' || new.item || ''' to ' || new.room,
      jsonb_build_object('decision', new.decision),
      v_actor
    );
    return new;

  elsif tg_op = 'UPDATE' then
    if old.decision is distinct from new.decision then
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'updated',
        'inventory',
        new.id,
        v_name || ' set ''' || new.item || ''' to ' || new.decision::text,
        jsonb_build_object('from_decision', old.decision, 'to_decision', new.decision),
        v_actor
      );
    else
      insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
      values (
        v_actor,
        'updated',
        'inventory',
        new.id,
        v_name || ' updated ''' || new.item || '''',
        null,
        v_actor
      );
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'deleted',
      'inventory',
      old.id,
      v_name || ' deleted ''' || old.item || ''' from ' || old.room,
      null,
      v_actor
    );
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger inventory_log_activity
  after insert or update or delete on inventory
  for each row execute function log_activity_inventory();

-- ===========================================================================
-- comments
-- ===========================================================================
-- A new comment is logged as the `commented` verb, attributed to the comment's
-- parent record (so the activity feed of a task includes its comments).
create or replace function log_activity_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_name  text;
begin
  if v_actor is null then
    return coalesce(new, old);
  end if;
  v_name := activity_actor_name(v_actor);

  if tg_op = 'INSERT' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'commented',
      new.parent_type,
      new.parent_id,
      v_name || ' commented on ' || new.parent_type::text,
      jsonb_build_object('comment_id', new.id),
      v_actor
    );
    return new;

  elsif tg_op = 'UPDATE' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'updated',
      new.parent_type,
      new.parent_id,
      v_name || ' edited a comment',
      jsonb_build_object('comment_id', new.id),
      v_actor
    );
    return new;

  elsif tg_op = 'DELETE' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'deleted',
      old.parent_type,
      old.parent_id,
      v_name || ' deleted a comment',
      jsonb_build_object('comment_id', old.id),
      v_actor
    );
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger comments_log_activity
  after insert or update or delete on comments
  for each row execute function log_activity_comments();

-- ===========================================================================
-- attachments
-- ===========================================================================
create or replace function log_activity_attachments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_name  text;
begin
  if v_actor is null then
    return coalesce(new, old);
  end if;
  v_name := activity_actor_name(v_actor);

  if tg_op = 'INSERT' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'attached',
      new.parent_type,
      new.parent_id,
      v_name || ' attached ' || new.filename || ' to ' || new.parent_type::text,
      jsonb_build_object('attachment_id', new.id, 'mime_type', new.mime_type),
      v_actor
    );
    return new;

  elsif tg_op = 'UPDATE' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'updated',
      new.parent_type,
      new.parent_id,
      v_name || ' updated attachment ' || new.filename,
      jsonb_build_object('attachment_id', new.id),
      v_actor
    );
    return new;

  elsif tg_op = 'DELETE' then
    insert into activity (actor_id, verb, parent_type, parent_id, summary, metadata, created_by)
    values (
      v_actor,
      'deleted',
      old.parent_type,
      old.parent_id,
      v_name || ' removed attachment ' || old.filename,
      jsonb_build_object('attachment_id', old.id),
      v_actor
    );
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger attachments_log_activity
  after insert or update or delete on attachments
  for each row execute function log_activity_attachments();

commit;
