-- Run this file in two separate Supabase SQL Editor executions.
-- Step 1 must be committed before Step 2 uses the new lead_source values.

-- Step 1:
alter type lead_source add value if not exists 'social';
alter type lead_source add value if not exists 'company';
alter type lead_source add value if not exists 'relations';

-- Step 2:
-- Run everything below in a second SQL Editor execution after Step 1 succeeds.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'buyer_purpose') then
    create type buyer_purpose as enum ('investment', 'personal_use');
  end if;

  if not exists (select 1 from pg_type where typname = 'buyer_status') then
    create type buyer_status as enum ('interested', 'not_interested', 'visited', 'inspection_done', 'purchased');
  end if;

  if not exists (select 1 from pg_type where typname = 'nile_side') then
    create type nile_side as enum ('east', 'west');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_plan') then
    create type payment_plan as enum ('cash', 'installment');
  end if;
end $$;

alter table leads
  alter column email drop not null,
  alter column interested_project_id drop not null,
  add column if not exists desired_nile_side nile_side,
  add column if not exists buyer_purpose buyer_purpose,
  add column if not exists desired_area numeric(10, 2),
  add column if not exists payment_plan payment_plan,
  add column if not exists call_result text,
  add column if not exists buyer_status buyer_status,
  add column if not exists client_recommendations text;

update leads
set
  source = case
    when source::text in ('facebook', 'website', 'campaign') then 'social'::lead_source
    when source::text = 'referral' then 'relations'::lead_source
    else 'company'::lead_source
  end,
  desired_nile_side = coalesce(desired_nile_side, 'east'::nile_side),
  buyer_purpose = coalesce(buyer_purpose, 'personal_use'::buyer_purpose),
  desired_area = coalesce(desired_area, 130),
  payment_plan = coalesce(payment_plan, 'cash'::payment_plan),
  buyer_status = coalesce(buyer_status, 'interested'::buyer_status)
where desired_nile_side is null
   or buyer_purpose is null
   or desired_area is null
   or payment_plan is null
   or buyer_status is null
   or source::text in ('facebook', 'website', 'referral', 'walk_in', 'campaign', 'other');

create index if not exists leads_buyer_status_idx on leads(buyer_status);
create index if not exists leads_desired_nile_side_idx on leads(desired_nile_side);
create index if not exists leads_buyer_purpose_idx on leads(buyer_purpose);
create index if not exists leads_payment_plan_idx on leads(payment_plan);
