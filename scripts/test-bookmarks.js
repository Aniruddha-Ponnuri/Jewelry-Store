/**
 * Test script to diagnose bookmark functionality issues
 * Run with: node scripts/test-bookmarks.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testBookmarks() {
  console.log('🔍 Testing Bookmarks Functionality\n');

  // 1. Check if bookmarks table exists
  console.log('1️⃣ Checking bookmarks table...');
  const { error: tablesError } = await supabase
    .from('bookmarks')
    .select('*')
    .limit(1);

  if (tablesError) {
    console.error('❌ Bookmarks table error:', tablesError.message);
    return;
  }
  console.log('✅ Bookmarks table exists\n');

  // 2. Check RLS policies
  console.log('2️⃣ Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase.rpc(
    'exec_sql',
    { 
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'bookmarks';
      `
    }
  ).catch(() => {
    // If exec_sql doesn't exist, check manually
    return supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'bookmarks');
  });

  if (policiesError) {
    console.warn('⚠️ Could not check policies directly:', policiesError.message);
  } else if (policies && policies.data) {
    console.log('📋 RLS Policies:', JSON.stringify(policies.data, null, 2));
  }
  console.log('');

  // 3. Get test user
  console.log('3️⃣ Getting test user...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('user_id, email, role')
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.error('❌ No test user found:', usersError?.message);
    return;
  }

  const testUser = users[0];
  console.log('✅ Test user:', testUser.email);
  console.log('');

  // 4. Get test product
  console.log('4️⃣ Getting test product...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('product_id, name')
    .limit(1);

  if (productsError || !products || products.length === 0) {
    console.error('❌ No test product found:', productsError?.message);
    return;
  }

  const testProduct = products[0];
  console.log('✅ Test product:', testProduct.name);
  console.log('');

  // 5. Try to insert a bookmark (with service key)
  console.log('5️⃣ Testing bookmark insertion...');
  const { data: insertData, error: insertError } = await supabase
    .from('bookmarks')
    .insert({
      user_id: testUser.user_id,
      product_id: testProduct.product_id
    })
    .select();

  if (insertError) {
    console.error('❌ Bookmark insertion failed:', insertError.message);
    console.error('Details:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Bookmark inserted successfully:', insertData);
  }
  console.log('');

  // 6. Check if bookmark exists
  console.log('6️⃣ Verifying bookmark exists...');
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', testUser.user_id)
    .eq('product_id', testProduct.product_id);

  if (bookmarksError) {
    console.error('❌ Bookmark query failed:', bookmarksError.message);
  } else {
    console.log('✅ Bookmarks found:', bookmarks.length);
    console.log('Details:', JSON.stringify(bookmarks, null, 2));
  }
  console.log('');

  // 7. Check bookmarks table structure
  console.log('7️⃣ Checking bookmarks table structure...');
  const { data: columns, error: columnsError } = await supabase.rpc(
    'exec_sql',
    {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'bookmarks'
        ORDER BY ordinal_position;
      `
    }
  ).catch(() => ({ data: null, error: 'exec_sql not available' }));

  if (columnsError) {
    console.warn('⚠️ Could not check columns:', columnsError);
  } else if (columns && columns.data) {
    console.log('📋 Table structure:', JSON.stringify(columns.data, null, 2));
  }
  console.log('');

  // 8. Clean up test bookmark
  if (insertData && insertData.length > 0) {
    console.log('8️⃣ Cleaning up test bookmark...');
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', testUser.user_id)
      .eq('product_id', testProduct.product_id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test bookmark cleaned up');
    }
  }

  console.log('\n✨ Bookmark diagnostics complete');
}

testBookmarks().catch(console.error);
