-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Policies
-- Allow users to view their own profile
create policy "Allow users to view own profile" on public.profiles for select using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);

-- Allow admins to view all profiles
create policy "Allow admins to view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 4. Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Function to make the first user an admin (Run this manually in SQL Editor after signup)
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
