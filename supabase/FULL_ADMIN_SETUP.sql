-- ==========================================
-- SCRIPT MAESTRO DE CONFIGURACIÓN ADMIN
-- ==========================================

-- 1. FUNCIÓN DE REGISTRO SEGURA (AUTO-ADMIN)
-- Esta función se ejecuta automáticamente cuando alguien se registra.
-- Lógica:
-- - Si la cédula es '26918994' -> Asigna rol 'admin' AUTOMÁTICAMENTE.
-- - Cualquier otra cédula -> Asigna rol 'user' (incluso si piden ser admin).

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
      -- ¡AQUÍ ESTÁ LA MAGIA!
      -- Si es TU cédula, te hace admin directo.
      when new.raw_user_meta_data->>'cedula' = '26918994' then 'admin'
      -- Para todos los demás, fuerza 'user'
      else 'user'
    end
  );
  return new;
end;
$$;

-- 2. FUNCIÓN PARA VERIFICAR DUPLICADOS
-- Permite al frontend saber si una cédula ya existe sin exponer datos.
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

-- 3. FUNCIÓN PARA RESETEAR CONTRASEÑAS (SOLO ADMINS)
-- Permite cambiar contraseñas desde el panel de control.
create or replace function public.admin_reset_password(user_id uuid, new_password text)
returns void
language plpgsql
security definer
as $$
begin
  -- Verificar que quien llama es admin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Acceso denegado: Solo administradores pueden resetear contraseñas';
  end if;

  -- Actualizar contraseña
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf'))
  where id = user_id;
end;
$$;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;

-- 4. LIMPIEZA DE EMERGENCIA (OPCIONAL)
-- Si ya existía tu usuario con rol incorrecto, esto lo arregla también.
update public.profiles
set role = 'admin'
where cedula = '26918994';
