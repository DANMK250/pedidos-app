-- IMPORTANT: Run this SQL in Supabase SQL Editor to reset the database for cedula-based auth

-- Step 1: Delete all existing auth users
-- Go to Supabase Dashboard → Authentication → Users → Delete all users manually

-- Step 2: Drop and recreate profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 3: Recreate profiles table with cedula fields
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  cedula text unique not null,
  first_name text not null,
  last_name text not null,
  email text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Step 4: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
CREATE POLICY "Allow users to view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Allow admins to view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Step 6: Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, cedula, first_name, last_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'cedula',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 8: NOW you can create your admin account from the app
-- Register with your cedula and select "Administrador" as department
