do $$
begin
  if not exists (select 1 from pg_type where typname = 'building_category') then
    create type building_category as enum ('tower', 'building', 'other');
  end if;
end $$;

alter table units
  add column if not exists building_category building_category;

create index if not exists units_building_category_idx on units(building_category);

update units
set building_category = 'building'
where building_category is null;
