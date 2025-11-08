/**
 * 通过手机号查询用户UUID
 * 使用方法: node scripts/get-user-uuid.js 13472881751
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUserUUID(phone) {
  console.log(`\n🔍 查询手机号: ${phone}`);
  console.log('='.repeat(60));

  try {
    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone, nickname, subscription_type, created_at')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('❌ 用户不存在');
        return;
      }
      throw error;
    }

    console.log('\n✅ 用户信息:');
    console.log('─'.repeat(60));
    console.log(`📱 手机号:        ${user.phone}`);
    console.log(`🆔 UUID:          ${user.id}`);
    console.log(`👤 昵称:          ${user.nickname || '(未设置)'}`);
    console.log(`💎 订阅类型:      ${user.subscription_type}`);
    console.log(`📅 创建时间:      ${new Date(user.created_at).toLocaleString('zh-CN')}`);
    console.log('─'.repeat(60));
    
    console.log('\n📋 复制以下UUID用于配置:');
    console.log('┌' + '─'.repeat(58) + '┐');
    console.log(`│ ${user.id} │`);
    console.log('└' + '─'.repeat(58) + '┘');

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

// 从命令行参数获取手机号
const phone = process.argv[2];

if (!phone) {
  console.error('❌ 请提供手机号');
  console.log('\n使用方法:');
  console.log('  node scripts/get-user-uuid.js 13472881751');
  process.exit(1);
}

getUserUUID(phone);

