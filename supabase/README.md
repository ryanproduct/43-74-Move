# Supabase — Move 43-74

All SQL for the Move 43-74 database lives here:

```
supabase/
├── migrations/
│   ├── 0001_initial.sql          # Tables, enums, indexes, RLS, triggers
│   └── 0002_activity_triggers.sql # Activity-log triggers per table
├── seed.sql                      # Starter rows (tasks, utilities, projects, inventory)
└── README.md                     # You are here
```

> A later prompt will add `0003_*.sql` to introduce the `profiles.email_daily`
> column used by the daily-summary email feature.

---

## 1. Install the Supabase CLI

On macOS via Homebrew:

```bash
brew install supabase/tap/supabase
```

(Other install options: <https://supabase.com/docs/guides/local-development/cli/getting-started>.)

Verify:

```bash
supabase --version
```

---

## 2. Link to the remote Supabase project

You only do this once per workstation. Grab the project ref from the Supabase
dashboard (Settings → General → Reference ID).

```bash
supabase link --project-ref <your-project-ref>
```

You will be prompted for the database password (Settings → Database).

---

## 3. Apply migrations

Push every migration in `supabase/migrations/` to the linked remote project:

```bash
supabase db push
```

For purely local development against `supabase start`:

```bash
supabase migration up
```

The migrations are ordered numerically (`0001_…`, `0002_…`) and should be
applied in that order.

---

## 4. Create the two auth users (manual, one-time)

The schema enforces RLS via the `profiles` table: a session is only allowed to
read/write data if `auth.uid()` is in `profiles`. Profile rows are created
automatically by the `on_auth_user_created` trigger (in `0001_initial.sql`)
whenever a new `auth.users` row appears — but the auto-filled defaults
(`display_name = email local-part`, `avatar_color = 'coral-500'`) need to be
overridden for Ryan and Eleanor.

### Step 4a — Create the users in the Supabase dashboard

In the dashboard: **Authentication → Users → Add user → "Create new user"**.
Create one user for each of these emails (you can set an arbitrary password —
they'll only ever log in via magic link):

- `ryanjude@gmail.com`
- `eleanor.oneill@gmail.com`

### Step 4b — Update the auto-created profile rows

Open the SQL editor (or `psql`) and run:

```sql
-- Ryan
update profiles
set display_name = 'Ryan',
    avatar_color = 'coral-500'
where email = 'ryanjude@gmail.com';

-- Eleanor
update profiles
set display_name = 'Eleanor',
    avatar_color = 'sky-500'
where email = 'eleanor.oneill@gmail.com';
```

Once `0003_*.sql` lands (introducing `email_daily`), also set:

```sql
update profiles set email_daily = true
where email in ('ryanjude@gmail.com', 'eleanor.oneill@gmail.com');
```

---

## 5. Load seed data

The seed file populates starter tasks, utilities, a project, and inventory
rooms. It does **not** insert profile rows.

Recommended (via the project's pooled connection string from the dashboard,
Settings → Database → Connection string → URI):

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Alternative: copy the contents of `supabase/seed.sql` into the dashboard SQL
editor and run it. The whole file is wrapped in a single transaction, so it is
all-or-nothing.

### Backfilling task owners after seed

The seed leaves `tasks.owner_id` NULL on every row, with a comment beside each
insert naming the intended assignee (Ryan / Eleanor / Both). Once profiles
exist you can backfill, e.g.:

```sql
update tasks
set owner_id = (select id from profiles where email = 'ryanjude@gmail.com')
where title in (
  'Notify council of move-out date',
  'Final meter readings on move-out day',
  'Cancel/transfer home insurance',
  'Return any rented equipment',
  'Confirm removals booking',
  'Hand back keys',
  'Change all locks',
  'Get quotes for bathroom',
  'Set up electricity & gas',
  'Set up water',
  'Register on council tax',
  'Update car insurance with new address'
);

update tasks
set owner_id = (select id from profiles where email = 'eleanor.oneill@gmail.com')
where title in (
  'Set up Royal Mail redirect',
  'Cancel/transfer contents insurance',
  'Source boxes & packing materials',
  'Set up broadband — order ASAP, often slow',
  'Update GP / dentist with new address',
  'Update school records'
);
```

Tasks listed as "Both" stay unassigned (`owner_id` NULL).

---

## 6. Quick sanity checks

After migrations + manual profile rows + seed:

```sql
-- Should return 2
select count(*) from profiles;

-- Should return 27 (13 hogarth + 13 addison + 1 both)
select count(*) from tasks;

-- Should return 15
select count(*) from utilities;

-- Should return 1
select count(*) from projects;

-- Should return 10
select count(*) from inventory;

-- Should return many policies, all with the "household members ..." names
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

---

## 7. Notes & gotchas

- **RLS is on for every table.** All access must go through an authenticated
  Supabase client whose session belongs to one of the two profiles. The
  service-role key bypasses RLS — only use it from server-side code.
- **Activity triggers require an authenticated `auth.uid()`.** When you load
  seed data via `psql` (no session), no `activity` rows are written — that's
  intentional. Activity logging only starts once Ryan and Eleanor begin using
  the app.
- **Profile auto-create on signup.** A trigger on `auth.users` inserts a row
  into `profiles` for any new user. Sign-up is meant to stay disabled in the
  Supabase Auth settings for v1; only Ryan and Eleanor's pre-created users
  exist.
