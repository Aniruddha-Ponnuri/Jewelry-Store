const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
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

async function checkProducts() {
  console.log('🔍 Checking products in database...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Check all products
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('product_id, name, is_in_stock, created_at')
    .order('created_at', { ascending: false });
  
  if (allError) {
    console.error('❌ Error fetching all products:', allError.message);
  } else {
    console.log(`📦 Total products in database: ${allProducts?.length || 0}`);
    if (allProducts && allProducts.length > 0) {
      console.log('\nSample products:');
      allProducts.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name} (ID: ${p.product_id}) - In Stock: ${p.is_in_stock}`);
      });
    }
  }
  
  // Check in-stock products (what homepage queries)
  const { data: inStockProducts, error: stockError } = await supabase
    .from('products')
    .select('product_id, name, is_in_stock')
    .eq('is_in_stock', true)
    .order('created_at', { ascending: false })
    .limit(6);
  
  if (stockError) {
    console.error('\n❌ Error fetching in-stock products:', stockError.message);
  } else {
    console.log(`\n✅ In-stock products (homepage query): ${inStockProducts?.length || 0}`);
    if (inStockProducts && inStockProducts.length > 0) {
      console.log('These products will appear on homepage:');
      inStockProducts.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name} (ID: ${p.product_id})`);
      });
    } else {
      console.log('⚠️  No in-stock products found! This is why homepage is empty.');
    }
  }
}

checkProducts().catch(console.error);
