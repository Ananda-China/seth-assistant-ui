#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 检查必要的环境变量和配置
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查部署配置...\n');

// 检查必要的文件
const requiredFiles = [
  'lib/supabase.ts',
  'lib/users-supabase.ts',
  'lib/store-supabase.ts',
  'lib/billing-supabase.ts',
  'supabase/migrations/001_initial_schema.sql'
];

console.log('📁 检查必要文件:');
let missingFiles = [];
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) missingFiles.push(file);
}

if (missingFiles.length > 0) {
  console.log(`\n❌ 缺少必要文件: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// 检查环境变量
console.log('\n🔧 检查环境变量:');

const requiredEnvVars = [
  'JWT_SECRET',
  'DIFY_API_URL',
  'DIFY_API_KEY'
];

const supabaseEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const optionalEnvVars = [
  'SMS_API_KEY',
  'SMS_SECRET',
  'ZPAY_MERCHANT_ID',
  'ZPAY_API_KEY',
  'ZPAY_API_SECRET'
];

// 检查基础环境变量
let missingEnvVars = [];
for (const envVar of requiredEnvVars) {
  const exists = !!process.env[envVar];
  console.log(`  ${exists ? '✅' : '❌'} ${envVar}`);
  if (!exists) missingEnvVars.push(envVar);
}

// 检查 Supabase 环境变量
const useSupabase = process.env.USE_SUPABASE === 'true';
console.log(`\n📊 数据库模式: ${useSupabase ? 'Supabase' : 'JSON 文件'}`);

if (useSupabase) {
  console.log('\n🗄️ 检查 Supabase 配置:');
  for (const envVar of supabaseEnvVars) {
    const exists = !!process.env[envVar];
    console.log(`  ${exists ? '✅' : '❌'} ${envVar}`);
    if (!exists) missingEnvVars.push(envVar);
  }
}

// 检查可选环境变量
console.log('\n🔧 可选配置:');
for (const envVar of optionalEnvVars) {
  const exists = !!process.env[envVar];
  console.log(`  ${exists ? '✅' : '⚠️ '} ${envVar} ${exists ? '' : '(可选)'}`);
}

// 检查 ZPay 模拟模式
const zpayMock = process.env.ZPAY_MOCK === '1';
console.log(`\n💳 支付模式: ${zpayMock ? '模拟模式' : '真实支付'}`);

if (missingEnvVars.length > 0) {
  console.log(`\n❌ 缺少必要的环境变量: ${missingEnvVars.join(', ')}`);
  console.log('\n请在 .env.local 文件中配置这些变量，或在 Vercel Dashboard 中设置。');
  process.exit(1);
}

// 检查 package.json
console.log('\n📦 检查依赖:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['@supabase/supabase-js', 'jsonwebtoken', 'next', 'react'];

for (const dep of requiredDeps) {
  const exists = !!packageJson.dependencies[dep];
  console.log(`  ${exists ? '✅' : '❌'} ${dep}`);
}

console.log('\n🎉 部署检查完成!');

if (useSupabase) {
  console.log('\n📋 下一步:');
  console.log('1. 确保 Supabase 项目已创建');
  console.log('2. 执行数据库迁移脚本');
  console.log('3. 在 Vercel 中配置环境变量');
  console.log('4. 部署应用');
} else {
  console.log('\n⚠️  当前使用 JSON 文件模式，建议切换到 Supabase:');
  console.log('1. 设置 USE_SUPABASE=true');
  console.log('2. 配置 Supabase 环境变量');
  console.log('3. 执行数据迁移');
}

console.log('\n🚀 准备部署!');
