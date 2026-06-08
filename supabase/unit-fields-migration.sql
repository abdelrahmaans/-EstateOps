do $$
begin
  if not exists (select 1 from pg_type where typname = 'nile_side') then
    create type nile_side as enum ('east', 'west');
  end if;

  if not exists (select 1 from pg_type where typname = 'unit_district') then
    create type unit_district as enum ('first_district', 'third_district', 'fourth_district', 'fifth_district', 'azhar_district', 'district_13', 'abasiry', 'zohour', 'ramad', 'rawda', 'mokbel', 'ard_el_horreya', 'corniche', 'abdelsalam_aref', 'salah_salem', 'tayaran_behind_stadium', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'finishing_status') then
    create type finishing_status as enum ('core_and_shell', 'semi_finished', 'fully_finished', 'super_lux');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_plan') then
    create type payment_plan as enum ('cash', 'installment');
  end if;

  if not exists (select 1 from pg_type where typname = 'building_category') then
    create type building_category as enum ('tower', 'building', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type delivery_status as enum ('under_construction', 'ready_to_deliver');
  end if;
end $$;

alter table units
  alter column code drop not null;

alter table units
  add column if not exists detailed_address text,
  add column if not exists building_category building_category,
  add column if not exists delivery_status delivery_status,
  add column if not exists nile_side nile_side,
  add column if not exists district unit_district,
  add column if not exists has_elevator boolean not null default false,
  add column if not exists load_percentage numeric(5, 2),
  add column if not exists finishing finishing_status,
  add column if not exists payment_plan payment_plan,
  add column if not exists notes text,
  add column if not exists owner_phone text,
  add column if not exists owner_name text;

create index if not exists units_nile_side_idx on units(nile_side);
create index if not exists units_district_idx on units(district);
create index if not exists units_finishing_idx on units(finishing);
create index if not exists units_payment_plan_idx on units(payment_plan);
create index if not exists units_building_category_idx on units(building_category);
create index if not exists units_delivery_status_idx on units(delivery_status);
