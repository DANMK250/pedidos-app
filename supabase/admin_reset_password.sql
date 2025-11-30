-- Function to allow admins to reset passwords
-- This uses the supabase_admin schema which is available in the SQL editor context
-- but we need to be careful. Standard Postgres functions can't easily change auth passwords
-- without using the internal auth schema.

-- SECURITY WARNING: This function allows any user with 'admin' role in public.profiles
-- to change ANY user's password. Ensure your admin check is robust.

create or replace function public.admin_reset_password(user_id uuid, new_password text)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if the executing user is an admin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Access denied: Only admins can reset passwords';
  end if;

  -- Update the user's password in the auth.users table
  -- We need to use the supabase internal function or direct update if allowed
  -- Direct update on auth.users requires superuser, which security definer provides if created by admin
  
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf'))
  where id = user_id;
end;
$$;

-- Grant execute permission to authenticated users (the function itself checks for admin role)
grant execute on function public.admin_reset_password(uuid, text) to authenticated;
