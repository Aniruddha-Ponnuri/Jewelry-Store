/**
 * Admin Authentication Test Script
 * Run with: node scripts/test-admin-auth.js
 * 
 * This script tests the admin authentication system by:
 * 1. Connecting to Supabase
 * 2. Checking if admin functions exist
 * 3. Testing admin_users table access
 * 4. Verifying RLS policies
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('Required variables:')
  console.log('  - NEXT_PUBLIC_SUPABASE_URL')
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminAuth() {
  console.log('🔍 Testing Admin Authentication System\n')
  console.log('=' .repeat(60))
  
  // Test 1: Check connection
  console.log('\n📡 Test 1: Supabase Connection')
  try {
    const { data, error } = await supabase.from('categories').select('count').limit(1)
    if (error) throw error
    console.log('✅ Connected to Supabase successfully')
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    return
  }
  
  // Test 2: Check if admin_users table exists
  console.log('\n📋 Test 2: admin_users Table')
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id, email, role, is_active')
      .limit(5)
    
    if (error) {
      console.error('❌ Cannot access admin_users table:', error.message)
      console.log('   Hint: Table might not exist or RLS is blocking access')
    } else {
      console.log(`✅ admin_users table exists (${data.length} admin(s) found)`)
      if (data.length > 0) {
        console.log('\n   Admin users:')
        data.forEach(admin => {
          console.log(`   - ${admin.email} (${admin.role}) - ${admin.is_active ? 'Active' : 'Inactive'}`)
        })
      } else {
        console.log('⚠️  No admin users found in the table')
        console.log('   You need to add at least one admin user')
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  // Test 3: Check if is_admin function exists (will fail without auth)
  console.log('\n🔐 Test 3: is_admin() Function')
  try {
    const { data, error } = await supabase.rpc('is_admin')
    
    if (error) {
      if (error.message.includes('Could not find the function')) {
        console.error('❌ is_admin() function does NOT exist')
        console.log('   Solution: Run the database setup script')
      } else if (error.message.includes('JWT') || error.message.includes('not authenticated')) {
        console.log('✅ Function exists (auth error expected without login)')
      } else {
        console.error('⚠️  Function call error:', error.message)
      }
    } else {
      console.log('✅ is_admin() function exists and returned:', data)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  // Test 4: Check is_master_admin function
  console.log('\n👑 Test 4: is_master_admin() Function')
  try {
    const { data, error } = await supabase.rpc('is_master_admin')
    
    if (error) {
      if (error.message.includes('Could not find the function')) {
        console.error('❌ is_master_admin() function does NOT exist')
        console.log('   Solution: Run the database setup script')
      } else if (error.message.includes('JWT') || error.message.includes('not authenticated')) {
        console.log('✅ Function exists (auth error expected without login)')
      } else {
        console.error('⚠️  Function call error:', error.message)
      }
    } else {
      console.log('✅ is_master_admin() function exists and returned:', data)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Summary and Next Steps:\n')
  console.log('1. If admin_users table is empty or doesn\'t exist:')
  console.log('   → Run: SupaSetup/COMPLETE-DATABASE-RECREATION-WORKING.sql')
  console.log('')
  console.log('2. If functions don\'t exist:')
  console.log('   → Run: SupaSetup/COMPLETE-DATABASE-RECREATION-WORKING.sql')
  console.log('')
  console.log('3. To add yourself as admin (in Supabase SQL Editor):')
  console.log('   → Run: SupaSetup/diagnose-admin-auth.sql')
  console.log('   → Or manually insert into admin_users table')
  console.log('')
  console.log('4. Test the web interface:')
  console.log('   → Start dev server: npm run dev')
  console.log('   → Login with your admin account')
  console.log('   → Visit: http://localhost:3000/admin/admin-test')
  console.log('')
  console.log('5. Check logs for detailed debugging:')
  console.log('   → See: ADMIN_LOGGING_QUICK_REF.md')
  console.log('')
}

// Run tests
testAdminAuth().catch(error => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})
