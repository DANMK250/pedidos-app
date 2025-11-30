-- Check if the profile exists
select * from public.profiles where cedula = '26918994';

-- Check RLS policies on profiles
select * from pg_policies where tablename = 'profiles';
