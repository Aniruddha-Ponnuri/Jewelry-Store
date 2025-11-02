/**
 * Test Login Functionality
 * Tests if login works with Supabase
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Get credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Missing environment variables')
  console.error('Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Test credentials - use your admin email
const TEST_EMAIL = 'pp0783.srmist@gmail.com'
const TEST_PASSWORD = process.argv[2] || 'your-password-here'

console.log('🔐 Login Test Script')
console.log('='.repeat(60))
console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
console.log(`📧 Test Email: ${TEST_EMAIL}`)
console.log('='.repeat(60))

async function testLogin() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    console.log('\n1️⃣ Testing login with signInWithPassword...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })

    if (error) {
      console.error('❌ Login failed:', error.message)
      console.error('Error details:', error)
      return
    }

    console.log('✅ Login successful!')
    console.log('\n📋 Session Info:')
    console.log('- User ID:', data.user?.id)
    console.log('- Email:', data.user?.email)
    console.log('- Email Verified:', data.user?.email_confirmed_at ? '✅ Yes' : '❌ No')
    console.log('- Access Token:', data.session?.access_token ? '✅ Present' : '❌ Missing')
    console.log('- Refresh Token:', data.session?.refresh_token ? '✅ Present' : '❌ Missing')

    // Now test admin status
    console.log('\n2️⃣ Testing admin status with session...')
    
    const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin')
    
    if (isAdminError) {
      console.error('❌ Admin check failed:', isAdminError.message)
    } else {
      console.log(`${isAdminData ? '✅' : '❌'} is_admin() returned: ${isAdminData}`)
    }

    const { data: isMasterAdminData, error: isMasterAdminError } = await supabase.rpc('is_master_admin')
    
    if (isMasterAdminError) {
      console.error('❌ Master admin check failed:', isMasterAdminError.message)
    } else {
      console.log(`${isMasterAdminData ? '✅' : '❌'} is_master_admin() returned: ${isMasterAdminData}`)
    }

    // Check admin_users table
    console.log('\n3️⃣ Testing admin_users table access...')
    
    const { data: adminRecord, error: adminRecordError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', data.user?.id)
      .single()

    if (adminRecordError) {
      console.error('❌ Failed to fetch admin record:', adminRecordError.message)
    } else if (adminRecord) {
      console.log('✅ Admin record found:')
      console.log('  - Email:', adminRecord.email)
      console.log('  - Role:', adminRecord.role)
      console.log('  - Active:', adminRecord.is_active)
    } else {
      console.log('❌ No admin record found for this user')
    }

    console.log('\n✅ Login test complete!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

// Run the test
if (TEST_PASSWORD === 'your-password-here') {
  console.error('\n❌ ERROR: Please provide your password as an argument')
  console.log('Usage: node scripts/test-login.js YOUR_PASSWORD')
  process.exit(1)
}

testLogin()
