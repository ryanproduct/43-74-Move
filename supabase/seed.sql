-- seed.sql
-- Move HQ — starter rows from PLAN.md section 10.
--
-- IMPORTANT: profile rows are NOT inserted here.
-- The two profile rows (Ryan, Eleanor) are created manually AFTER the
-- corresponding auth.users rows are created via the Supabase dashboard.
-- See /supabase/README.md for the exact post-seed SQL snippet.
--
-- Owner assignments below follow the PLAN.md section 10 labels (Ryan / Eleanor
-- / Both). Because profile ids are not known until after the manual auth-user
-- step, `owner_id` is left NULL on every task and the intended assignee is
-- recorded in a comment beside each insert. To backfill ownership after
-- profiles exist, run something like:
--
--   -- Ryan's tasks
--   update tasks set owner_id = (select id from profiles where email = 'ryanjude@gmail.com')
--     where title in ('Notify council of move-out date', ...);
--   -- Eleanor's tasks
--   update tasks set owner_id = (select id from profiles where email = 'eleanor.oneill@gmail.com')
--     where title in ('Set up Royal Mail redirect', ...);
--
-- All inserts are wrapped in a single transaction so the seed is atomic.

begin;

-- ---------------------------------------------------------------------------
-- Projects (PLAN.md section 10.3)
-- ---------------------------------------------------------------------------
insert into projects (name, property, status, end_date, description)
values (
  'New bathroom — 74 Addison Way',
  'addison',
  'planning',
  date '2026-07-28',
  'Renovate the upstairs bathroom at 74 Addison Way before the family moves in. Get three quotes, choose a contractor, schedule the work to land before the 2 August move-out from Hogarth.'
);

-- ---------------------------------------------------------------------------
-- Utilities (PLAN.md section 10.2 — starter ~15)
-- ---------------------------------------------------------------------------
insert into utilities (name, type, hogarth_action, addison_action, status, notes) values
  ('Octopus Energy (Electricity)', 'electricity',       'final_reading', 'setup',         'not_started', null),
  ('British Gas (Gas)',            'gas',               'final_reading', 'setup',         'not_started', null),
  ('Thames Water',                 'water',             'final_reading', 'setup',         'not_started', null),
  ('Virgin Media (Broadband)',     'broadband',         'cancel',        'setup',         'not_started', 'Order broadband at Addison ASAP — install slots often 2-3 weeks out.'),
  ('Mobile — Ryan',                'mobile',            'na',            'keep_existing', 'not_started', 'Address update only.'),
  ('Mobile — Eleanor',             'mobile',            'na',            'keep_existing', 'not_started', 'Address update only.'),
  ('TV Licence',                   'tv_licence',        'transfer',      'transfer',      'not_started', null),
  ('Council Tax',                  'council_tax',       'cancel',        'setup',         'not_started', 'Notify old council of move-out, register with new council.'),
  ('Home Insurance',               'insurance_home',    'cancel',        'setup',         'not_started', null),
  ('Contents Insurance',           'insurance_contents','transfer',      'transfer',      'not_started', null),
  ('Car Insurance',                'insurance_car',     'na',            'keep_existing', 'not_started', 'Address update only.'),
  ('Royal Mail Redirect',          'post_redirect',     'na',            'na',            'not_started', '12-month redirect from move-out date.'),
  ('Streaming (Netflix/Disney+/Spotify)', 'subscriptions','na',          'keep_existing', 'not_started', 'Address update only.'),
  ('Amazon',                       'subscriptions',     'na',            'keep_existing', 'not_started', 'Update default delivery address.'),
  ('Refuse / Recycling',           'other',             'cancel',        'setup',         'not_started', 'Council collection schedule + recycling bin orders.');

-- ---------------------------------------------------------------------------
-- Tasks (PLAN.md section 10.1)
-- ---------------------------------------------------------------------------
-- owner_id is NULL for every row; see header comment for the backfill plan.

-- Hogarth side ---------------------------------------------------------------
insert into tasks (title, property, category, owner_id, status, priority, due_date, description) values
  ('Notify council of move-out date',           'hogarth', 'admin',     null, 'todo', 'med',  null,             null),  -- Ryan
  ('Set up Royal Mail redirect',                'hogarth', 'admin',     null, 'todo', 'med',  null,             'Use the Royal Mail redirect service for 12 months from move-out date.'),  -- Eleanor
  ('Book end-of-tenancy / deep clean',          'hogarth', 'cleaning',  null, 'todo', 'med',  null,             null),  -- Both
  ('Final meter readings on move-out day',      'hogarth', 'utilities', null, 'todo', 'high', date '2026-08-02','Photograph readings for electricity, gas and water on the day we hand keys back.'),  -- Ryan
  ('Cancel/transfer home insurance',            'hogarth', 'utilities', null, 'todo', 'med',  null,             null),  -- Ryan
  ('Cancel/transfer contents insurance',        'hogarth', 'utilities', null, 'todo', 'med',  null,             null),  -- Eleanor
  ('Return any rented equipment',               'hogarth', 'admin',     null, 'todo', 'low',  null,             null),  -- Ryan
  ('Sort loft / garage — keep/sell/donate/bin', 'hogarth', 'packing',   null, 'todo', 'med',  null,             'Loft and garage first — biggest volume, most "shouldn''t have kept" items.'),  -- Both
  ('Source boxes & packing materials',          'hogarth', 'packing',   null, 'todo', 'med',  null,             null),  -- Eleanor
  ('Pack non-essentials early',                 'hogarth', 'packing',   null, 'todo', 'med',  null,             'Books, out-of-season clothes, decor. Anything we won''t miss for 6+ weeks.'),  -- Both
  ('Confirm removals booking',                  'hogarth', 'admin',     null, 'todo', 'high', null,             null),  -- Ryan
  ('Clean before handover',                     'hogarth', 'cleaning',  null, 'todo', 'med',  date '2026-08-01',null),  -- Both
  ('Hand back keys',                            'hogarth', 'admin',     null, 'todo', 'high', date '2026-08-02',null);  -- Ryan

-- Addison side --------------------------------------------------------------
insert into tasks (title, property, category, owner_id, status, priority, due_date, description) values
  ('Collect keys to 74 Addison Way',            'addison', 'admin',     null, 'todo', 'high', date '2026-05-29','Pick up keys from the agent on the morning of 29 May.'),  -- Both
  ('Change all locks',                          'addison', 'admin',     null, 'todo', 'high', date '2026-05-29','Day-one priority. Front door, back door, side gate.'),  -- Ryan
  ('Walk through with snagging list',           'addison', 'admin',     null, 'todo', 'med',  null,             null),  -- Both
  ('Get quotes for bathroom',                   'addison', 'renovation',null, 'todo', 'high', null,             'Get at least three quotes for the bathroom renovation before choosing.'),  -- Ryan
  ('Choose bathroom contractor',                'addison', 'renovation',null, 'todo', 'high', null,             null),  -- Both
  ('Set up electricity & gas',                  'addison', 'utilities', null, 'todo', 'high', null,             null),  -- Ryan
  ('Set up broadband — order ASAP, often slow', 'addison', 'utilities', null, 'todo', 'high', null,             'Broadband installs commonly run 2-3 weeks. Order the day we collect keys.'),  -- Eleanor
  ('Set up water',                              'addison', 'utilities', null, 'todo', 'med',  null,             null),  -- Ryan
  ('Register on council tax',                   'addison', 'utilities', null, 'todo', 'med',  null,             null),  -- Ryan
  ('Update GP / dentist with new address',      'addison', 'admin',     null, 'todo', 'low',  null,             null),  -- Eleanor
  ('Update school records',                     'addison', 'kids',      null, 'todo', 'med',  null,             null),  -- Eleanor
  ('Update car insurance with new address',     'addison', 'utilities', null, 'todo', 'med',  null,             null),  -- Ryan
  ('Deep clean before moving in',               'addison', 'cleaning',  null, 'todo', 'med',  null,             null);  -- Both

-- Both -----------------------------------------------------------------------
insert into tasks (title, property, category, owner_id, status, priority, due_date, description) values
  (
    'Update address everywhere',
    'both',
    'admin',
    null,
    'todo',
    'med',
    null,
    '## Update address on:

- Bank(s)
- Credit cards
- DVLA
- Passport (on renewal)
- Employer / HR
- Subscriptions
- Online retailers

Can be split between Ryan and Eleanor — track sub-items as comments.'
  );  -- Both

-- ---------------------------------------------------------------------------
-- Inventory rooms (PLAN.md section 10.4 — empty rows for structure)
-- ---------------------------------------------------------------------------
-- Rooms at 43 Hogarth. No items yet — these placeholder rows give the UI a
-- room structure to render against. They can be deleted once real items are
-- captured.
insert into inventory (room, item, decision, notes) values
  ('Living room',     '(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Kitchen',         '(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Master bedroom',  '(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Kids'' bedroom 1','(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Kids'' bedroom 2','(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Bathroom',        '(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Garden',          '(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Loft',            '(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Garage',          '(no items yet)', 'undecided', 'Placeholder row — delete once items are added.'),
  ('Hallway',         '(no items yet)', 'undecided', 'Placeholder row — delete once items are added.');

commit;
