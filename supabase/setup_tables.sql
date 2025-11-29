-- 1. Tabla Asesoras (LA DEJAMOS QUIETA)
-- drop table if exists public.asesoras cascade; 

-- 2. Reiniciar Tabla Clientes
drop table if exists public.clientes cascade;

create table public.clientes (
  id uuid default gen_random_uuid() primary key,
  name text,              -- Agregado para que coincida con tu columna "Name" (aunque tenga datos basura)
  client_name text,
  business_name text,
  rif_cedula text,
  phone text,
  address text,
  route text,
  advisor_id uuid references public.asesoras(id), 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar seguridad
alter table public.clientes enable row level security;

-- 4. Políticas de acceso
create policy "Lectura pública clientes" on public.clientes for select to public using (true);
create policy "Escritura pública clientes" on public.clientes for insert to public with check (true);
