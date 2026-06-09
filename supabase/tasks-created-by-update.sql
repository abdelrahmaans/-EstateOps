-- Add task creator tracking.
-- Run this in Supabase SQL Editor before using the Tasks page creator column.

alter table tasks
  add column if not exists created_by uuid references profiles(id) on delete set null;

update tasks
set created_by = coalesce(
  created_by,
  assigned_to,
  (
    select id
    from profiles
    where role in ('admin', 'manager')
    order by
      case role when 'admin' then 0 else 1 end,
      created_at
    limit 1
  )
)
where created_by is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_created_by_fkey'
  ) then
    alter table tasks
      add constraint tasks_created_by_fkey
      foreign key (created_by) references profiles(id) on delete set null;
  end if;
end $$;

create index if not exists tasks_created_by_idx on tasks(created_by);

select 'tasks creator ready' as status;
