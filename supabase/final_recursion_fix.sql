-- FINAL FIX FOR RLS RECURSION
-- We use a SECURITY DEFINER function to check admin status without triggering RLS loops.

-- 1. Create a secure function to check if user is admin
-- This function runs with elevated privileges (Security Definer) to bypass RLS checks, preventing the infinite loop.
create or replace function public.is_admin()
returns boolean
language sql
security definer 
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- 2. Disable RLS temporarily to clean up
alter table public.profiles disable row level security;

-- 3. Drop ALL existing policies on profiles to start fresh
drop policy if exists "Allow users to view own profile" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Allow admins to view all profiles" on public.profiles;
drop policy if exists "Enable read access for all users" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;
drop policy if exists "Simple view own profile" on public.profiles;
drop policy if exists "Simple update own profile" on public.profiles;
drop policy if exists "Admins view all" on public.profiles;
drop policy if exists "View Own Profile" on public.profiles;
drop policy if exists "Update Own Profile" on public.profiles;
drop policy if exists "Admins View All" on public.profiles;
drop policy if exists "Admins Update All" on public.profiles;

-- 4. Re-enable RLS
alter table public.profiles enable row level security;

-- 5. Create NON-RECURSIVE Policies

-- Policy: View Own Profile (Everyone can see their own data)
create policy "View Own Profile"
on public.profiles for select
using ( auth.uid() = id );

-- Policy: Update Own Profile (Everyone can update their own data)
create policy "Update Own Profile"
on public.profiles for update
using ( auth.uid() = id );

-- Policy: Admins View All (Uses the function to avoid recursion)
create policy "Admins View All"
on public.profiles for select
using ( is_admin() );

-- Policy: Admins Update All
create policy "Admins Update All"
on public.profiles for update
using ( is_admin() );

-- Policy: Admins Insert
create policy "Admins Insert"
on public.profiles for insert
with check ( is_admin() );

-- Policy: Admins Delete
create policy "Admins Delete"
on public.profiles for delete
using ( is_admin() );
