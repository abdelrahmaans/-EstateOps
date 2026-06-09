-- Add/update Future Line sales team users.
-- Run this in Supabase SQL Editor.
-- Important: every user must have a different UUID. Reusing the same UUID updates
-- the old user, which is why one sales user can appear to replace another.

create extension if not exists pgcrypto with schema extensions;

create or replace function upsert_sales_user(
  desired_id uuid,
  user_email text,
  user_password text,
  user_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  existing_id uuid;
  final_id uuid;
begin
  select id
  into existing_id
  from auth.users
  where lower(email) = lower(user_email)
  limit 1;

  final_id := coalesce(existing_id, desired_id);

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    final_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    user_email,
    extensions.crypt(user_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', user_full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do update set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    final_id,
    final_id::text,
    jsonb_build_object('sub', final_id::text, 'email', user_email),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider_id, provider) do update set
    identity_data = excluded.identity_data,
    updated_at = now();

  insert into profiles (
    id,
    full_name,
    email,
    role
  ) values (
    final_id,
    user_full_name,
    user_email,
    'sales'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role;

  return final_id;
end;
$$;

select upsert_sales_user(
  '00000000-0000-0000-0000-000000000101',
  'rania@futureline.com',
  'rania@25',
  'Rania'
);

select upsert_sales_user(
  '00000000-0000-0000-0000-000000000102',
  'moahmedtarek@futureline.com',
  'Wizz@2020',
  'Mohamed Tarek'
);

drop function upsert_sales_user(uuid, text, text, text);

select id, full_name, email, role
from profiles
where role = 'sales'
order by full_name;
