// 调试激活码系统
const { createClient } = require('@supabase/supabase-js');

// 请替换为您的实际Supabase配置
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SERVICE_ROLE_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.log('请在脚本中设置正确的Supabase URL和Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugActivation() {
  try {
    console.log('🔍 调试激活码系统...\n');
    
    // 1. 检查激活码是否存在
    console.log('1. 检查激活码 9USRDANO:');
    const { data: code, error: codeError } = await supabase
      .from('activation_codes')
      .select('*, plan:plans(*)')
      .eq('code', '9USRDANO')
      .single();
    
    if (codeError) {
      console.error('❌ 激活码不存在或查询失败:', codeError.message);
      return;
    }
    
    console.log('✅ 激活码信息:');
    console.log('   ID:', code.id);
    console.log('   套餐:', code.plan?.name);
    console.log('   价格:', code.plan?.price);
    console.log('   已使用:', code.is_used);
    console.log('   过期时间:', code.expires_at);
    
    // 2. 检查用户表结构
    console.log('\n2. 检查用户表结构:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ 查询用户表失败:', usersError.message);
    } else {
      console.log('✅ 用户表字段:', Object.keys(users?.[0] || {}));
    }
    
    // 3. 检查是否有测试用户
    console.log('\n3. 检查测试用户:');
    const { data: testUsers, error: testUsersError } = await supabase
      .from('users')
      .select('id, phone, nickname, invited_by')
      .limit(5);
    
    if (testUsersError) {
      console.error('❌ 查询测试用户失败:', testUsersError.message);
    } else {
      console.log('✅ 测试用户:', testUsers?.map(u => `${u.phone} (${u.nickname || '无昵称'})`));
    }
    
    console.log('\n🎉 调试完成！');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugActivation();
