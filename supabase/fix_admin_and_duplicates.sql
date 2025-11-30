-- 1. Function to check if a cedula exists (Securely)
-- This allows the frontend to check for duplicates without exposing the profiles table
create or replace function public.check_cedula_exists(cedula_to_check text)
returns boolean
language plpgsql
security definer -- Runs with privileges of the creator (admin)
as $$
begin
  return exists (
    select 1 from public.profiles where cedula = cedula_to_check
  );
end;
$$;

-- 2. Force Admin Role for your Cedula
-- This ensures your specific user is definitely an admin
update public.profiles
set role = 'admin'
where cedula = '26918994';

-- 3. Ensure RLS policies are correct for the new function
-- (Functions don't need RLS, but we need to make sure it's callable)
grant execute on function public.check_cedula_exists(text) to anon, authenticated, service_role;
