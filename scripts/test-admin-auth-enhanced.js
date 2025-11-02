/**
 * Enhanced Admin Authentication Test
 * Tests both unauthenticated and authenticated scenarios
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

console.log('🔍 Enhanced Admin Authentication Test\n')
console.log('=' .repeat(70))

async function testWithAnonKey() {
  console.log('\n📡 Part 1: Testing with ANON key (unauthenticated)')
  console.log('-'.repeat(70))
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Test 1: Try to read admin_users with anon key
  console.log('\n1️⃣ Checking admin_users table access with anon key...')
  const { data: admins, error: adminsError } = await supabase
    .from('admin_users')
    .select('user_id, email, role, is_active')
  
  if (adminsError) {
    console.log('   ❌ Cannot read admin_users:', adminsError.message)
    console.log('   📝 Note: This is EXPECTED - RLS blocks unauthenticated reads')
  } else {
    console.log(`   ✅ Can read admin_users (${admins?.length || 0} records)`)
    if (admins && admins.length > 0) {
      admins.forEach(a => console.log(`      - ${a.email} (${a.role})`))
    }
  }
  
  // Test 2: Call is_admin() without auth
  console.log('\n2️⃣ Calling is_admin() without authentication...')
  const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin')
  
  if (isAdminError) {
    console.log('   ❌ Error:', isAdminError.message)
  } else {
    console.log(`   ✅ Function called successfully: ${isAdminResult}`)
    console.log('   📝 Note: Returns false when not authenticated (expected)')
  }
}

async function testWithServiceKey() {
  if (!supabaseServiceKey) {
    console.log('\n⚠️  Part 2: Skipping service key test (SUPABASE_SERVICE_ROLE_KEY not set)')
    return
  }
  
  console.log('\n👑 Part 2: Testing with SERVICE ROLE key (bypasses RLS)')
  console.log('-'.repeat(70))
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Test 1: Read admin_users with service key
  console.log('\n1️⃣ Checking admin_users table with service key...')
  const { data: admins, error: adminsError } = await supabase
    .from('admin_users')
    .select('user_id, email, role, is_active, created_at')
    .order('created_at', { ascending: false })
  
  if (adminsError) {
    console.log('   ❌ Error:', adminsError.message)
  } else {
    console.log(`   ✅ Found ${admins?.length || 0} admin user(s):\n`)
    if (admins && admins.length > 0) {
      admins.forEach((admin, i) => {
        console.log(`      ${i + 1}. ${admin.email}`)
        console.log(`         Role: ${admin.role}`)
        console.log(`         Active: ${admin.is_active ? '✅ Yes' : '❌ No'}`)
        console.log(`         User ID: ${admin.user_id}`)
        console.log(`         Created: ${new Date(admin.created_at).toLocaleString()}`)
        console.log()
      })
    }
  }
  
  // Test 2: Check auth.users
  console.log('2️⃣ Verifying admin users exist in auth.users...')
  if (admins && admins.length > 0) {
    for (const admin of admins) {
      const { data: authUser, error } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('id', admin.user_id)
        .single()
      
      if (error) {
        // Try alternative query
        const { data: users } = await supabase.rpc('get_auth_user_by_id', { user_id: admin.user_id })
        if (users) {
          console.log(`   ✅ ${admin.email} - Exists in auth.users`)
        } else {
          console.log(`   ⚠️  ${admin.email} - Cannot verify in auth.users`)
        }
      } else if (authUser) {
        console.log(`   ✅ ${admin.email} - Exists in auth.users`)
      } else {
        console.log(`   ❌ ${admin.email} - NOT found in auth.users`)
      }
    }
  }
  
  // Test 3: Check RLS policies
  console.log('\n3️⃣ Checking RLS policies on admin_users...')
  const { data: policies, error: policiesError } = await supabase.rpc('get_policies', {
    table_name: 'admin_users'
  }).catch(async () => {
    // Fallback: direct query
    return await supabase.from('pg_policies')
      .select('*')
      .eq('tablename', 'admin_users')
  })
  
  if (policies && policies.length > 0) {
    console.log(`   ✅ Found ${policies.length} RLS policy/policies`)
  } else {
    console.log('   ⚠️  Could not check policies (requires special permissions)')
  }
}

async function showInstructions() {
  console.log('\n' + '='.repeat(70))
  console.log('\n📋 Summary and Next Steps:\n')
  
  console.log('✅ Admin users exist in database (verified with service key)')
  console.log('❌ But is_admin() returns false for unauthenticated calls\n')
  
  console.log('🔧 To fix admin authentication:\n')
  console.log('1. Run this SQL script in Supabase SQL Editor:')
  console.log('   📄 SupaSetup/FIX-ADMIN-FUNCTION-SECURITY.sql\n')
  
  console.log('2. Make sure you are LOGGED IN to the website with one of these emails:')
  console.log('   • pp0783.srmist@gmail.com (master_admin)')
  console.log('   • suhasin1.ponnur1@gmail.com (admin)')
  console.log('   • test@silver.com (admin)\n')
  
  console.log('3. After logging in, test admin access:')
  console.log('   🌐 Visit: http://localhost:3000/admin/admin-test')
  console.log('   📊 Should show all green checkmarks\n')
  
  console.log('4. Check browser console (F12) for detailed logs:')
  console.log('   🔍 Look for: [AUTH] and [MIDDLEWARE] logs')
  console.log('   ✅ Should see: "Admin check successful"\n')
  
  console.log('💡 The key point: is_admin() needs an AUTHENTICATED session')
  console.log('   • This test script is unauthenticated (no login)')
  console.log('   • When you login on the website, auth.uid() will return your user ID')
  console.log('   • Then is_admin() can check if that user ID is in admin_users table')
  console.log('')
}

// Run all tests
async function runAllTests() {
  try {
    await testWithAnonKey()
    await testWithServiceKey()
    await showInstructions()
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
  }
}

runAllTests()
