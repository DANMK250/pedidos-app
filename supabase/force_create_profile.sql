-- FORCE CREATE PROFILE
-- If the trigger failed, this script manually inserts the profile for your user.

insert into public.profiles (id, email, cedula, first_name, last_name, role)
select 
  id, 
  email, 
  '26918994', -- Cedula
  'Daniel',   -- Nombre
  'Armas',    -- Apellido
  'admin'     -- Rol
from auth.users
where email = '26918994@pedidos.app'
on conflict (id) do update
set role = 'admin', cedula = '26918994';

-- Verify insertion
select * from public.profiles where cedula = '26918994';
