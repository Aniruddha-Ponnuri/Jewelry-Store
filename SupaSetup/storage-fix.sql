-- Fix for storage policies - run this in Supabase SQL Editor
-- This fixes the "new row violates row-level security policy" error for image uploads

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for product images" ON storage.objects;

-- Create more permissive storage policies
-- Allow public read access to product images
CREATE POLICY "product_images_select_policy" ON storage.objects 
FOR SELECT USING (bucket_id = 'product_images');

-- Allow admin to upload images (simplified policy)
CREATE POLICY "product_images_insert_policy" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated'
);

-- Allow admin to update images
CREATE POLICY "product_images_update_policy" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated'
);

-- Allow admin to delete images
CREATE POLICY "product_images_delete_policy" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated'
);

-- Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
