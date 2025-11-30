-- DEBUG USER PROFILE & RLS
-- Run this to see exactly what is happening with your user data.

-- 1. Check auth.users (The login system)
select id as auth_id, email, raw_user_meta_data from auth.users where email like '%26918994%';

-- 2. Check public.profiles (The app data)
select id as profile_id, cedula, role, first_name from public.profiles where cedula = '26918994';

-- 3. Check if IDs match
select 
  u.id as auth_id, 
  p.id as profile_id, 
  (u.id = p.id) as ids_match,
  p.role as profile_role
from auth.users u
left join public.profiles p on u.id = p.id
where u.email like '%26918994%';

-- 4. Check RLS Policies again
select * from pg_policies where tablename = 'profiles';
