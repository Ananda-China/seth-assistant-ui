// 测试管理员登录修复
const BASE_URL = 'http://localhost:3002';

async function testAdminLogin() {
  console.log('🧪 测试管理员登录修复...\n');

  try {
    // 1. 测试管理员登录（使用新密码）
    console.log('1. 测试新密码登录...');
    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'AdminPass123!'
      }),
    });
    
    console.log('登录响应状态:', loginResponse.status);
    const loginResult = await loginResponse.json();
    console.log('登录结果:', loginResult);

    if (loginResult.success) {
      console.log('✅ 管理员登录成功！');
      
      // 获取cookie
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('获取到的cookies:', cookies ? '有' : '无');
      
      if (cookies) {
        console.log('\n2. 测试管理后台页面访问...');
        // 测试访问管理后台主页
        const adminResponse = await fetch(`${BASE_URL}/admin`, {
          headers: {
            'Cookie': cookies
          }
        });
        
        console.log('管理后台访问状态:', adminResponse.status);
        if (adminResponse.ok) {
          console.log('✅ 管理后台页面访问成功！');
        } else {
          console.log('❌ 管理后台页面访问失败');
        }
      }
    } else {
      console.log('❌ 管理员登录失败:', loginResult.message);
      
      // 如果登录失败，可能需要执行数据库迁移
      console.log('\n⚠️ 可能需要执行数据库迁移来更新管理员密码');
      console.log('请在 Supabase 控制台中执行以下 SQL:');
      console.log(`
-- 删除旧的管理员记录
DELETE FROM admins WHERE username = 'admin';

-- 插入新的管理员记录（密码: AdminPass123!）
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2b$12$hpN2yaecdgBDsYXWy14jzuAJFbsLpQgHPqcCufV1QqKTKbryWwEC.');
      `);
    }

    console.log('\n🎯 测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testAdminLogin();
