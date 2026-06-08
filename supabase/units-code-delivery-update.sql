do $$
begin
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type delivery_status as enum ('under_construction', 'ready_to_deliver');
  end if;
end $$;

alter table units
  alter column code drop not null,
  add column if not exists delivery_status delivery_status;

update units
set delivery_status = 'under_construction'
where delivery_status is null;

create index if not exists units_delivery_status_idx on units(delivery_status);
