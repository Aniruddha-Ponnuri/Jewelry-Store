-- Fix for users table permission denied error
-- Run this in Supabase SQL Editor

-- Drop existing users table policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;

-- Create more permissive policies for users table
-- Allow authenticated users to read any user data (needed for admin checks)
CREATE POLICY "users_select_authenticated" ON users 
FOR SELECT TO authenticated 
USING (true);

-- Allow users to insert their own data
CREATE POLICY "users_insert_own" ON users 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "users_update_own" ON users 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to delete their own data
CREATE POLICY "users_delete_own" ON users 
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Also create a function to handle user creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
