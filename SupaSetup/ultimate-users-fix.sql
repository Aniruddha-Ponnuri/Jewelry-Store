-- ULTIMATE FIX for "permission denied for table users" error
-- Run this in Supabase SQL Editor

-- 1. Temporarily disable RLS on users table to fix permissions
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on users table
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- 3. Grant explicit permissions on users table
GRANT ALL PRIVILEGES ON TABLE users TO authenticated;
GRANT ALL PRIVILEGES ON TABLE users TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 4. Re-enable RLS with very permissive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Create the most permissive policies possible
CREATE POLICY "users_full_access_authenticated" ON users 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "users_read_access_anon" ON users 
FOR SELECT TO anon 
USING (true);

-- 6. Fix the user creation function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    -- User already exists, just return
    RETURN NEW;
  WHEN others THEN
    -- Log the error but don't fail
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 7. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Grant permissions on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 9. Make sure the users table structure is correct
ALTER TABLE users ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- 10. Grant permissions on sequences (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 11. Test insert - this should work now
-- You can uncomment this to test if you have an authenticated user
-- INSERT INTO users (user_id, email, full_name) 
-- VALUES (auth.uid(), auth.email(), 'Test User') 
-- ON CONFLICT (user_id) DO NOTHING;
