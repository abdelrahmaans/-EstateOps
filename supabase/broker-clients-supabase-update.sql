do $$
begin
  if not exists (select 1 from pg_type where typname = 'broker_client_status') then
    create type broker_client_status as enum ('interested', 'not_interested', 'visited', 'inspection_done', 'purchased');
  end if;
end $$;

create table if not exists broker_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  call_result text,
  status broker_client_status not null default 'interested',
  assigned_to uuid references profiles(id) on delete set null,
  client_recommendations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists broker_clients_status_idx on broker_clients(status);
create index if not exists broker_clients_assigned_to_idx on broker_clients(assigned_to);
create index if not exists broker_clients_phone_idx on broker_clients(phone);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists broker_clients_set_updated_at on broker_clients;
create trigger broker_clients_set_updated_at
before update on broker_clients
for each row execute function set_updated_at();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'buyer_status'
  ) then
    execute $sql$
      insert into broker_clients (
        id,
        name,
        phone,
        call_result,
        status,
        assigned_to,
        client_recommendations,
        created_at,
        updated_at
      )
      select
        gen_random_uuid(),
        name,
        phone,
        call_result,
        coalesce(buyer_status::text, 'interested')::broker_client_status,
        assigned_to,
        client_recommendations,
        created_at,
        updated_at
      from leads
      where buyer_status is not null
         or call_result is not null
         or client_recommendations is not null
      on conflict (id) do nothing
    $sql$;
  end if;
end $$;

alter table broker_clients enable row level security;

drop policy if exists "broker clients role based read" on broker_clients;
create policy "broker clients role based read"
on broker_clients for select
to authenticated
using (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
);

drop policy if exists "broker clients secretary and management insert" on broker_clients;
create policy "broker clients secretary and management insert"
on broker_clients for insert
to authenticated
with check (current_user_role() in ('admin', 'manager', 'secretary'));

drop policy if exists "broker clients role based update" on broker_clients;
create policy "broker clients role based update"
on broker_clients for update
to authenticated
using (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
)
with check (
  current_user_role() in ('admin', 'manager', 'secretary')
  or assigned_to = auth.uid()
);

drop policy if exists "broker clients management delete" on broker_clients;
create policy "broker clients management delete"
on broker_clients for delete
to authenticated
using (is_admin_or_manager());
