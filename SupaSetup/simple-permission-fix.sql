-- SIMPLE PERMISSION FIX - run this if the ultimate fix doesn't work
-- This grants broad permissions to fix the "permission denied" error

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON bookmarks TO authenticated;

GRANT SELECT ON users TO anon;
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Temporarily disable RLS if needed
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;

-- Simple test query - run this to check if permissions work
-- SELECT COUNT(*) FROM users;
