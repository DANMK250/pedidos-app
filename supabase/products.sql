-- 1. Reset: Drop the table if it already exists (This deletes ALL data to prevent duplicates)
drop table if exists public.products;

-- 2. Create the products table (Simple version without prices)
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

-- NO SAMPLE DATA INSERTED
-- This ensures the table is empty so you can import your CSV without "Duplicate Key" errors.
