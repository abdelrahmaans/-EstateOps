-- Demo password for all seeded users: Demo@123456
-- These users are inserted into Supabase Auth first because public.profiles.id
-- has a foreign key to auth.users.id.

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
) values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@estateops.local',
    crypt('Demo@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@estateops.local',
    crypt('Demo@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Sales Manager"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'secretary@estateops.local',
    crypt('Demo@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Secretary User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sales@estateops.local',
    crypt('Demo@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Sales Agent"}'::jsonb,
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
) values
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@estateops.local"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"manager@estateops.local"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"secretary@estateops.local"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    '{"sub":"00000000-0000-0000-0000-000000000004","email":"sales@estateops.local"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do update set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into profiles (id, full_name, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@estateops.local', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Sales Manager', 'manager@estateops.local', 'manager'),
  ('00000000-0000-0000-0000-000000000003', 'Secretary User', 'secretary@estateops.local', 'secretary'),
  ('00000000-0000-0000-0000-000000000004', 'Sales Agent', 'sales@estateops.local', 'sales')
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email, role = excluded.role;

insert into projects (id, name, location, description, status) values
  ('10000000-0000-0000-0000-000000000001', 'North Gate Residence', 'New Cairo', 'Residential compound with apartments and duplexes.', 'active'),
  ('10000000-0000-0000-0000-000000000002', 'Marina Business Hub', 'New Capital', 'Mixed-use offices and retail units.', 'active'),
  ('10000000-0000-0000-0000-000000000003', 'Palm Valley Villas', '6th of October', 'Low-density villa community.', 'planning')
on conflict (id) do nothing;

insert into units (project_id, code, type, area, floor, price, status) values
  ('10000000-0000-0000-0000-000000000001', 'NG-A-101', 'apartment', 135, 1, 4200000, 'available'),
  ('10000000-0000-0000-0000-000000000001', 'NG-D-203', 'duplex', 220, 2, 7100000, 'reserved'),
  ('10000000-0000-0000-0000-000000000002', 'MB-O-0904', 'office', 88, 9, 5600000, 'available'),
  ('10000000-0000-0000-0000-000000000003', 'PV-V-12', 'villa', 340, null, 15800000, 'sold')
on conflict (code) do nothing;

insert into leads (id, name, phone, email, source, interested_project_id, budget, status, assigned_to, notes, next_follow_up_date) values
  ('20000000-0000-0000-0000-000000000001', 'Omar Hassan', '+201001112233', 'omar@example.com', 'facebook', '10000000-0000-0000-0000-000000000001', 5000000, 'follow_up', '00000000-0000-0000-0000-000000000004', 'Interested in 3-bedroom apartment.', current_date),
  ('20000000-0000-0000-0000-000000000002', 'Mona Ali', '+201002223344', 'mona@example.com', 'website', '10000000-0000-0000-0000-000000000002', 6500000, 'new', '00000000-0000-0000-0000-000000000004', 'Asked for office payment plan.', current_date + 2),
  ('20000000-0000-0000-0000-000000000003', 'Youssef Samir', '+201003334455', null, 'referral', '10000000-0000-0000-0000-000000000003', 16000000, 'site_visit', null, 'Villa inquiry.', current_date - 1)
on conflict (id) do nothing;

insert into lead_activities (id, lead_id, type, note, created_by) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'call', 'Initial qualification call completed.', '00000000-0000-0000-0000-000000000004'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'whatsapp', 'Shared brochure and available units.', '00000000-0000-0000-0000-000000000004'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'meeting', 'Site visit scheduled with family.', '00000000-0000-0000-0000-000000000003')
on conflict (id) do nothing;

insert into tasks (id, title, description, assigned_to, related_lead_id, due_date, priority, status) values
  ('40000000-0000-0000-0000-000000000001', 'Send payment plan', 'Prepare North Gate 3-bedroom plan.', '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', current_date, 'high', 'pending'),
  ('40000000-0000-0000-0000-000000000002', 'Confirm site visit', 'Call client to confirm arrival time.', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', current_date - 1, 'medium', 'in_progress'),
  ('40000000-0000-0000-0000-000000000003', 'Update unit availability', 'Review reserved inventory with sales manager.', '00000000-0000-0000-0000-000000000002', null, current_date + 3, 'low', 'pending')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  assigned_to = excluded.assigned_to,
  related_lead_id = excluded.related_lead_id,
  due_date = excluded.due_date,
  priority = excluded.priority,
  status = excluded.status;
