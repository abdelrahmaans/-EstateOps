-- Ensure created/updated timestamps are automatic for visible app data.
-- Run this in Supabase SQL Editor.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table projects
  add column if not exists updated_at timestamptz not null default now();

alter table units
  add column if not exists updated_at timestamptz not null default now();

alter table leads
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table broker_clients
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table tasks
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table projects
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table units
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table lead_activities
  alter column created_at set default now();

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
before update on projects
for each row execute function set_updated_at();

drop trigger if exists units_set_updated_at on units;
create trigger units_set_updated_at
before update on units
for each row execute function set_updated_at();

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
before update on leads
for each row execute function set_updated_at();

drop trigger if exists broker_clients_set_updated_at on broker_clients;
create trigger broker_clients_set_updated_at
before update on broker_clients
for each row execute function set_updated_at();

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
before update on tasks
for each row execute function set_updated_at();

select 'timestamps ready' as status;
