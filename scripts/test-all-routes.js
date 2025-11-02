const http = require('http');

const BASE_URL = 'http://localhost:3000';

const routes = [
  '/',
  '/products',
  '/login',
  '/register',
  '/bookmarks',
  '/forgot-password',
  '/admin',
  '/admin/products',
  '/admin/categories',
  '/admin/users',
  '/api/health',
  '/privacy',
  '/terms',
  '/shipping',
  '/returns'
];

console.log('🧪 Testing all routes...\n');

async function testRoute(path) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    
    http.get(url, (res) => {
      const statusEmoji = res.statusCode === 200 ? '✅' : 
                         res.statusCode === 404 ? '❌' : 
                         res.statusCode === 302 || res.statusCode === 307 ? '🔀' : '⚠️';
      
      console.log(`${statusEmoji} ${path.padEnd(25)} → Status: ${res.statusCode}`);
      
      if (res.statusCode === 302 || res.statusCode === 307) {
        console.log(`   ↳ Redirects to: ${res.headers.location}`);
      }
      
      resolve({ path, status: res.statusCode, redirect: res.headers.location });
    }).on('error', (err) => {
      console.log(`❌ ${path.padEnd(25)} → Error: ${err.message}`);
      resolve({ path, error: err.message });
    });
  });
}

async function runTests() {
  const results = [];
  
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);
    await new Promise(r => setTimeout(r, 100)); // Small delay between requests
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 200).length;
  const redirects = results.filter(r => r.status === 302 || r.status === 307).length;
  const errors = results.filter(r => r.error || r.status === 404).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`🔀 Redirects:  ${redirects}`);
  console.log(`❌ Errors:     ${errors}`);
  console.log(`📝 Total:      ${results.length}`);
  
  if (errors > 0) {
    console.log('\n⚠️  Some routes returned errors. This may be expected for protected routes.');
  } else {
    console.log('\n🎉 All routes are accessible!');
  }
}

// Check if server is running
http.get(BASE_URL, (res) => {
  console.log(`✅ Server is running at ${BASE_URL}\n`);
  runTests();
}).on('error', (err) => {
  console.error(`❌ Server is not running at ${BASE_URL}`);
  console.error(`   Please start the development server with: npm run dev`);
  process.exit(1);
});
