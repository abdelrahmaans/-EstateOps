create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'manager', 'secretary', 'sales');
create type lead_status as enum ('new', 'contacted', 'follow_up', 'site_visit', 'negotiation', 'reserved', 'contracted', 'lost');
create type lead_source as enum ('facebook', 'website', 'referral', 'walk_in', 'campaign', 'other');
create type activity_type as enum ('call', 'whatsapp', 'meeting', 'note', 'follow_up');
create type project_status as enum ('planning', 'active', 'completed', 'paused');
create type unit_status as enum ('available', 'reserved', 'sold');
create type unit_type as enum ('studio', 'apartment', 'duplex', 'villa', 'office', 'retail');
create type task_status as enum ('pending', 'in_progress', 'done', 'cancelled');
create type task_priority as enum ('low', 'medium', 'high');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role user_role not null default 'sales',
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  description text,
  status project_status not null default 'active',
  created_at timestamptz not null default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  code text not null unique,
  type unit_type not null,
  area numeric(10, 2) not null check (area > 0),
  floor integer,
  price numeric(14, 2) not null check (price >= 0),
  status unit_status not null default 'available',
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  source lead_source not null default 'other',
  interested_project_id uuid references projects(id) on delete set null,
  budget numeric(14, 2),
  status lead_status not null default 'new',
  assigned_to uuid references profiles(id) on delete set null,
  notes text,
  next_follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  type activity_type not null,
  note text not null,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references profiles(id) on delete set null,
  related_lead_id uuid references leads(id) on delete set null,
  due_date date,
  priority task_priority not null default 'medium',
  status task_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_idx on leads(status);
create index leads_assigned_to_idx on leads(assigned_to);
create index leads_next_follow_up_date_idx on leads(next_follow_up_date);
create index tasks_assigned_to_idx on tasks(assigned_to);
create index tasks_due_date_idx on tasks(due_date);
create index units_project_id_idx on units(project_id);
create index units_status_idx on units(status);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at before update on leads for each row execute function set_updated_at();
create trigger tasks_set_updated_at before update on tasks for each row execute function set_updated_at();

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
alter table lead_activities enable row level security;
alter table tasks enable row level security;

create policy "profiles read self or management"
on profiles for select
to authenticated
using (id = auth.uid() or is_admin_or_manager());

create policy "profiles management write"
on profiles for all
to authenticated
using (is_admin_or_manager())
with check (is_admin_or_manager());

create policy "projects all authenticated read"
on projects for select
to authenticated
using (true);

create policy "projects management write"
on projects for all
to authenticated
using (is_admin_or_manager())
with check (is_admin_or_manager());

create policy "units all authenticated read"
on units for select
to authenticated
using (true);

create policy "units management write"
on units for all
to authenticated
using (is_admin_or_manager())
with check (is_admin_or_manager());

create policy "leads role based read"
on leads for select
to authenticated
using (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
);

create policy "leads secretary and management insert"
on leads for insert
to authenticated
with check (current_user_role() in ('admin', 'manager', 'secretary'));

create policy "leads role based update"
on leads for update
to authenticated
using (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
)
with check (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
);

create policy "leads management delete"
on leads for delete
to authenticated
using (is_admin_or_manager());

create policy "lead activities role based read"
on lead_activities for select
to authenticated
using (
  exists (
    select 1 from leads
    where leads.id = lead_activities.lead_id
      and (
        current_user_role() in ('admin', 'manager', 'secretary')
        or leads.assigned_to = auth.uid()
      )
  )
);

create policy "lead activities role based insert"
on lead_activities for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from leads
    where leads.id = lead_activities.lead_id
      and (
        current_user_role() in ('admin', 'manager', 'secretary')
        or leads.assigned_to = auth.uid()
      )
  )
);

create policy "tasks role based read"
on tasks for select
to authenticated
using (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
);

create policy "tasks secretary and management insert"
on tasks for insert
to authenticated
with check (current_user_role() in ('admin', 'manager', 'secretary'));

create policy "tasks role based update"
on tasks for update
to authenticated
using (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
)
with check (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
);

create policy "tasks management delete"
on tasks for delete
to authenticated
using (is_admin_or_manager());
