-- 1. Reset: Drop the table if it already exists (CAUTION: deletes existing data)
drop table if exists public.products;

-- 2. Create the products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  codigo text not null unique,
  prd_descripcion text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.products enable row level security;

-- 4. Create a policy to allow everyone to read products (public access)
create policy "Enable read access for all users"
on public.products
for select
to public
using (true);

-- 5. Insert Sample Data
insert into public.products (codigo, prd_descripcion)
values
  ('001', 'DELIVERY'),
  ('002', 'PAQUETE KIT 1 Y 2 (1000 U)'),
  ('003', 'PAQUETE KIT 1 Y 2 (500 U)'),
  ('ACT-001', 'ACTIVADOR DE BATERIA IPOWER X'),
  ('ACT-002', 'ACTIVADOR DE BATERIAS SUNSHINE SS-915'),
  ('ACT-003', 'REACTIVADOR IPOWER X'),
  ('AD-001', 'ADAPTADOR KOUDERS'),
  ('AD-002', 'ADAPTADOR DE EUROPEO A AMERICANO NEGRO'),
  ('AD-003', 'CONECTOR SENCILLO'),
  ('AD-004', 'ADAPTADOR DE AUDIO C A JACK 3.5');
