-- MVP RLS fix for visible app actions.
-- Run this in Supabase SQL Editor when inserts/updates/deletes fail with:
-- new row violates row-level security policy

create or replace function current_user_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin_or_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(current_user_role() in ('admin', 'manager'), false);
$$;

alter table profiles enable row level security;
alter table projects enable row level security;
alter table units enable row level security;
alter table leads enable row level security;
alter table broker_clients enable row level security;
alter table lead_activities enable row level security;

drop policy if exists "profiles read self or management" on profiles;
drop policy if exists "profiles all authenticated read" on profiles;
create policy "profiles all authenticated read"
on profiles for select
to authenticated
using (true);

drop policy if exists "profiles management write" on profiles;
create policy "profiles management write"
on profiles for all
to authenticated
using (is_admin_or_manager())
with check (is_admin_or_manager());

drop policy if exists "projects all authenticated read" on projects;
drop policy if exists "projects management write" on projects;
drop policy if exists "projects authenticated insert" on projects;
drop policy if exists "projects authenticated update" on projects;
drop policy if exists "projects authenticated delete" on projects;

create policy "projects all authenticated read"
on projects for select
to authenticated
using (true);

create policy "projects authenticated insert"
on projects for insert
to authenticated
with check (auth.uid() is not null);

create policy "projects authenticated update"
on projects for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "projects authenticated delete"
on projects for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "units all authenticated read" on units;
drop policy if exists "units management write" on units;
drop policy if exists "units authenticated insert" on units;
drop policy if exists "units authenticated update" on units;
drop policy if exists "units authenticated delete" on units;

create policy "units all authenticated read"
on units for select
to authenticated
using (true);

create policy "units authenticated insert"
on units for insert
to authenticated
with check (auth.uid() is not null);

create policy "units authenticated update"
on units for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "units authenticated delete"
on units for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "leads role based read" on leads;
drop policy if exists "leads secretary and management insert" on leads;
drop policy if exists "leads role based update" on leads;
drop policy if exists "leads management delete" on leads;
drop policy if exists "leads authenticated read" on leads;
drop policy if exists "leads authenticated insert" on leads;
drop policy if exists "leads authenticated update" on leads;
drop policy if exists "leads authenticated delete" on leads;

create policy "leads authenticated read"
on leads for select
to authenticated
using (true);

create policy "leads authenticated insert"
on leads for insert
to authenticated
with check (auth.uid() is not null);

create policy "leads authenticated update"
on leads for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "leads authenticated delete"
on leads for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "broker clients role based read" on broker_clients;
drop policy if exists "broker clients secretary and management insert" on broker_clients;
drop policy if exists "broker clients role based update" on broker_clients;
drop policy if exists "broker clients management delete" on broker_clients;
drop policy if exists "broker clients authenticated read" on broker_clients;
drop policy if exists "broker clients authenticated insert" on broker_clients;
drop policy if exists "broker clients authenticated update" on broker_clients;
drop policy if exists "broker clients authenticated delete" on broker_clients;

create policy "broker clients authenticated read"
on broker_clients for select
to authenticated
using (true);

create policy "broker clients authenticated insert"
on broker_clients for insert
to authenticated
with check (auth.uid() is not null);

create policy "broker clients authenticated update"
on broker_clients for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "broker clients authenticated delete"
on broker_clients for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "lead activities role based read" on lead_activities;
drop policy if exists "lead activities role based insert" on lead_activities;
drop policy if exists "lead activities authenticated read" on lead_activities;
drop policy if exists "lead activities authenticated insert" on lead_activities;

create policy "lead activities authenticated read"
on lead_activities for select
to authenticated
using (true);

create policy "lead activities authenticated insert"
on lead_activities for insert
to authenticated
with check (created_by = auth.uid());
