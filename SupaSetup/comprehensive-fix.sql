-- COMPREHENSIVE FIX for all current issues
-- Run this in Supabase SQL Editor to fix all permission and policy issues

-- 1. Fix users table policies (more permissive)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;

CREATE POLICY "users_select_authenticated" ON users 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "users_insert_own" ON users 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own" ON users 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own" ON users 
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 2. Fix storage policies (remove admin email check that causes issues)
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for product images" ON storage.objects;
DROP POLICY IF EXISTS "product_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_policy" ON storage.objects;

CREATE POLICY "product_images_select_policy" ON storage.objects 
FOR SELECT USING (bucket_id = 'product_images');

CREATE POLICY "product_images_insert_policy" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "product_images_update_policy" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "product_images_delete_policy" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated'
);

-- 3. Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public) VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Create user auto-creation function with better error handling
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
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the signup
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for auto user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7. Insert sample data if needed
INSERT INTO categories (name, description, emoji) VALUES 
  ('rings', 'Beautiful silver rings for all occasions', '💍'),
  ('necklaces', 'Elegant silver necklaces and chains', '📿'),
  ('earrings', 'Stunning silver earrings and studs', '👂'),
  ('bracelets', 'Stylish silver bracelets and bangles', '💎'),
  ('pendants', 'Delicate silver pendants and charms', '🪬')
ON CONFLICT (name) DO NOTHING;

-- 8. Make sure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
