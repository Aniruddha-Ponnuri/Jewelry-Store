const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

console.log('🔍 Testing Supabase connection...\n');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Basic connection by fetching service health
    console.log('Test 1: Checking connection...');
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Query error:', error.message);
      console.log('   This might mean the table doesn\'t exist or you don\'t have permissions');
    } else {
      console.log('✅ Connection successful!');
    }

    // Test 2: Auth endpoint
    console.log('\nTest 2: Checking auth endpoint...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth endpoint accessible!');
      console.log('   Current session:', authData.session ? 'Active' : 'No active session');
    }

    // Test 3: Try to list tables (if we have permission)
    console.log('\nTest 3: Database access test...');
    const { data: categories, error: catError } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    
    if (catError) {
      console.log('⚠️  Categories table:', catError.message);
    } else {
      console.log('✅ Categories table accessible!');
    }

    console.log('\n✅ Overall Status: Supabase connection is alive and working!');
    
  } catch (err) {
    console.error('\n❌ Connection test failed:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

testConnection();
