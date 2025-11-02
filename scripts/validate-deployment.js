#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Run this before deploying to catch common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment validation...\n');

const errors = [];
const warnings = [];

// Check 1: Required files exist
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'tsconfig.json',
  'vercel.json',
  '.env.example',
];

console.log('📁 Checking required files...');
requiredFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing required file: ${file}`);
  } else {
    console.log(`  ✅ ${file}`);
  }
});

// Check 2: Environment variables template
console.log('\n🔐 Checking environment configuration...');
const envExample = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExample)) {
  const content = fs.readFileSync(envExample, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL',
    'CRON_SECRET',
  ];
  
  requiredVars.forEach((v) => {
    if (content.includes(v)) {
      console.log(`  ✅ ${v} documented`);
    } else {
      warnings.push(`Environment variable ${v} not documented in .env.example`);
    }
  });
}

// Check 3: Package.json configuration
console.log('\n📦 Validating package.json...');
const pkgPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Check scripts
  const requiredScripts = ['build', 'start', 'dev'];
  requiredScripts.forEach((script) => {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`  ✅ Script "${script}" defined`);
    } else {
      errors.push(`Missing required script: ${script}`);
    }
  });
  
  // Check dependencies
  const criticalDeps = ['next', 'react', '@supabase/supabase-js'];
  criticalDeps.forEach((dep) => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`  ✅ Dependency "${dep}" installed`);
    } else {
      errors.push(`Missing critical dependency: ${dep}`);
    }
  });
}

// Check 4: TypeScript configuration
console.log('\n⚙️  Validating TypeScript config...');
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  if (tsconfig.compilerOptions) {
    const opts = tsconfig.compilerOptions;
    
    if (opts.strict) {
      console.log('  ✅ Strict mode enabled');
    } else {
      warnings.push('TypeScript strict mode is not enabled');
    }
    
    if (opts.forceConsistentCasingInFileNames) {
      console.log('  ✅ Consistent casing enforced');
    } else {
      errors.push('forceConsistentCasingInFileNames should be enabled');
    }
  }
}

// Check 5: Next.js configuration
console.log('\n⚡ Validating Next.js config...');
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  console.log('  ✅ next.config.ts exists');
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (content.includes('output')) {
    console.log('  ✅ Output configuration detected');
  } else {
    warnings.push('Consider adding output configuration for optimization');
  }
}

// Check 6: Vercel configuration
console.log('\n🚀 Validating Vercel config...');
const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
if (fs.existsSync(vercelConfigPath)) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  
  if (vercelConfig.crons) {
    console.log('  ✅ Cron jobs configured');
  }
  
  if (vercelConfig.functions) {
    console.log('  ✅ Function settings configured');
  }
}

// Check 7: Critical directories
console.log('\n📂 Checking project structure...');
const criticalDirs = [
  'src/app',
  'src/components',
  'src/lib',
  'public',
];

criticalDirs.forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✅ ${dir}/`);
  } else {
    warnings.push(`Directory ${dir}/ not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Validation Summary');
console.log('='.repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✨ All checks passed! Ready to deploy.\n');
  process.exit(0);
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach((w) => console.log(`  • ${w}`));
}

if (errors.length > 0) {
  console.log('\n❌ Errors (must fix before deploying):');
  errors.forEach((e) => console.log(`  • ${e}`));
  console.log('\n');
  process.exit(1);
}

console.log('\n⚠️  Found warnings but no critical errors.');
console.log('Review warnings and deploy when ready.\n');
process.exit(0);
