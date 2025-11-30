-- FIX PROFILE ID MISMATCH
-- This script deletes any "zombie" profile with your cedula and creates a fresh one linked to your current login.

DO $$
DECLARE
  current_auth_id uuid;
BEGIN
  -- 1. Get the current Auth ID for your email
  select id into current_auth_id from auth.users where email like '26918994%' limit 1;

  IF current_auth_id IS NOT NULL THEN
    -- 2. Delete ANY profile with this cedula (to remove old/zombie records)
    delete from public.profiles where cedula = '26918994';
    
    -- 3. Delete ANY profile with this ID (just to be safe)
    delete from public.profiles where id = current_auth_id;

    -- 4. Insert the CORRECT profile
    insert into public.profiles (id, email, cedula, first_name, last_name, role)
    values (
      current_auth_id,
      '26918994@pedidos.app',
      '26918994',
      'Daniel',
      'Armas',
      'admin'
    );
    
    RAISE NOTICE 'Profile fixed for ID: %', current_auth_id;
  ELSE
    RAISE NOTICE 'User not found in auth.users!';
  END IF;
END $$;

-- Verify the fix
select * from public.profiles where cedula = '26918994';
