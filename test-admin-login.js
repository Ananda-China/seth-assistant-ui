const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('🔍 测试管理员登录...');
    
    // 1. 登录管理员
    const loginResponse = await fetch('http://localhost:3001/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });

    if (!loginResponse.ok) {
      console.error('❌ 管理员登录失败:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ 管理员登录成功:', loginData);

    // 获取cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 获取到的cookies:', cookies);

    if (!cookies) {
      console.error('❌ 没有获取到admin_token cookie');
      return;
    }

    // 2. 使用cookie访问用户管理API
    const usersResponse = await fetch('http://localhost:3001/api/admin/users?page=1&limit=10', {
      headers: {
        'Cookie': cookies
      }
    });

    if (!usersResponse.ok) {
      console.error('❌ 获取用户数据失败:', usersResponse.status, await usersResponse.text());
      return;
    }

    const usersData = await usersResponse.json();
    console.log('✅ 用户数据获取成功:');
    console.log('用户数量:', usersData.users?.length || 0);
    console.log('分页信息:', usersData.pagination);
    console.log('用户样本:', usersData.users?.slice(0, 2));

    // 3. 测试调试API
    const debugResponse = await fetch('http://localhost:3001/api/debug-admin', {
      headers: {
        'Cookie': cookies
      }
    });

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ 调试信息:');
      console.log('管理员认证状态:', debugData.adminAuth?.isAuthenticated);
      console.log('用户模块状态:', debugData.usersModule?.success);
      console.log('直接Supabase查询:', debugData.directSupabaseQuery?.success, '用户数量:', debugData.directSupabaseQuery?.count);
    }

  } catch (error) {
    console.error('❌ 测试过程出错:', error);
  }
}

testAdminLogin();
