-- Complete database setup for Silver Jewelry website
-- Run this SQL in your Supabase SQL Editor

-- Create categories table first (since products will reference it)
CREATE TABLE IF NOT EXISTS categories (
  category_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  product_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  material VARCHAR(100),
  weight DECIMAL(8, 2),
  gemstone VARCHAR(100),
  image_path VARCHAR(500),
  is_in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Create users table (for additional user info, auth is handled by Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  bookmark_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(product_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
  UNIQUE(user_id, product_id)
);

-- Insert some initial categories
INSERT INTO categories (name, description, emoji) VALUES 
  ('rings', 'Beautiful silver rings for all occasions', '💍'),
  ('necklaces', 'Elegant silver necklaces and chains', '📿'),
  ('earrings', 'Stunning silver earrings and studs', '👂'),
  ('bracelets', 'Stylish silver bracelets and bangles', '💎'),
  ('pendants', 'Delicate silver pendants and charms', '🪬')
ON CONFLICT (name) DO NOTHING;

-- Drop all existing policies to avoid recursion
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;

DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_insert_admin" ON products;
DROP POLICY IF EXISTS "products_update_admin" ON products;
DROP POLICY IF EXISTS "products_delete_admin" ON products;

DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON categories;
DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
DROP POLICY IF EXISTS "categories_update_admin" ON categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON categories;

DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON bookmarks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON bookmarks;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_select_own" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_own" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users table policies (more permissive to avoid permission errors)
-- Allow authenticated users to read any user data (needed for admin email checks)
CREATE POLICY "users_select_authenticated" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert_own" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own" ON users FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create function to handle user creation on signup
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Products table policies (public read, admin write)
CREATE POLICY "products_select_all" ON products FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "products_insert_admin" ON products FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@silver.com'
  )
);
CREATE POLICY "products_update_admin" ON products FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@silver.com'
  )
);
CREATE POLICY "products_delete_admin" ON products FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@silver.com'
  )
);

-- Categories table policies (public read, admin write)
CREATE POLICY "categories_select_all" ON categories FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@silver.com'
  )
);
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@silver.com'
  )
);
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@silver.com'
  )
);

-- Bookmarks table policies (users can only access their own)
CREATE POLICY "bookmarks_select_own" ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up storage policies (more permissive for file operations)
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
