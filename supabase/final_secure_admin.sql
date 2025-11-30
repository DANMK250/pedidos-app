-- 1. SECURE THE SIGNUP TRIGGER
-- This modifies the trigger to IGNORE any request to be 'admin' during signup.
-- If someone tries to sign up as 'admin', they will be forced to 'user'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, cedula, first_name, last_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'cedula',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    case 
      -- SECURITY: Force 'user' if someone tries to sign up as 'admin'
      when new.raw_user_meta_data->>'role' = 'admin' then 'user'
      -- Otherwise accept the requested role (or default to 'user')
      else coalesce(new.raw_user_meta_data->>'role', 'user')
    end
  );
  return new;
end;
$$;

-- 2. ASSIGN ADMIN ROLE TO YOUR SPECIFIC CEDULA
-- This command manually promotes your specific user to admin.
-- It will only affect the user with cedula '26918994'.
update public.profiles
set role = 'admin'
where cedula = '26918994';

-- 3. ENSURE DUPLICATE CHECK FUNCTION EXISTS
-- Re-applying this just in case, to ensure validations work.
create or replace function public.check_cedula_exists(cedula_to_check text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.profiles where cedula = cedula_to_check
  );
end;
$$;

grant execute on function public.check_cedula_exists(text) to anon, authenticated, service_role;
