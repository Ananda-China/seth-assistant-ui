// 测试管理员登录功能
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少Supabase配置');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminLogin() {
  console.log('🔍 开始测试管理员登录功能...\n');

  try {
    // 1. 检查管理员表是否存在
    console.log('1. 检查管理员表...');
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admins')
      .select('*');

    if (adminsError) {
      console.error('❌ 管理员表查询失败:', adminsError);
    } else {
      console.log('✅ 管理员表查询成功，找到', admins?.length || 0, '个管理员');
      if (admins && admins.length > 0) {
        console.log('   管理员信息:', {
          username: admins[0].username,
          hasPassword: !!admins[0].password_hash
        });
      }
    }

    // 2. 测试管理员登录API
    console.log('\n2. 测试管理员登录API...');
    const loginResponse = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log('   登录API响应状态:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('   登录API响应数据:', loginData);

    if (loginResponse.ok) {
      console.log('✅ 管理员登录成功');
      
      // 3. 测试激活码列表API
      console.log('\n3. 测试激活码列表API...');
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('   获取到的Cookie:', cookies);

      const codesResponse = await fetch('http://localhost:3000/api/admin/activation-codes', {
        method: 'GET',
        headers: {
          'Cookie': cookies || ''
        }
      });

      console.log('   激活码API响应状态:', codesResponse.status);
      const codesData = await codesResponse.json();
      console.log('   激活码API响应数据:', codesData);
    } else {
      console.error('❌ 管理员登录失败');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testAdminLogin().then(() => {
  console.log('\n🏁 管理员登录测试完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
