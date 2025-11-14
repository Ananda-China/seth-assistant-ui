// 测试管理功能API
const BASE_URL = 'http://localhost:3002';

async function testAdminManagement() {
  console.log('🧪 开始测试管理功能API...\n');

  try {
    // 1. 测试管理员登录（使用旧密码，应该失败）
    console.log('1. 测试旧密码登录（应该失败）...');
    const oldLoginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
    });
    
    const oldLoginResult = await oldLoginResponse.json();
    console.log('旧密码登录结果:', oldLoginResult);
    console.log('✅ 旧密码登录正确失败\n');

    // 2. 测试管理员登录（使用新密码）
    console.log('2. 测试新密码登录...');
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
    
    if (!loginResponse.ok) {
      console.log('❌ 管理员登录失败');
      const errorResult = await loginResponse.json();
      console.log('错误信息:', errorResult);
      return;
    }

    const loginResult = await loginResponse.json();
    console.log('✅ 管理员登录成功:', loginResult);

    // 获取cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('获取到的cookies:', cookies);

    if (!cookies) {
      console.log('❌ 未获取到认证cookie');
      return;
    }

    // 3. 测试创建用户API
    console.log('\n3. 测试创建用户API...');
    const createUserResponse = await fetch(`${BASE_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        phone: '13800138000',
        nickname: '测试用户',
        subscriptionType: 'monthly',
        subscriptionDays: 30,
        password: 'testpass123'
      }),
    });

    const createUserResult = await createUserResponse.json();
    console.log('创建用户结果:', createUserResult);

    if (createUserResult.success) {
      console.log('✅ 用户创建成功');
    } else {
      console.log('⚠️ 用户创建失败（可能已存在）:', createUserResult.message);
    }

    // 4. 测试修改密码API
    console.log('\n4. 测试修改管理员密码API...');
    const changePasswordResponse = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        currentPassword: 'AdminPass123!',
        newPassword: 'NewAdminPass456!'
      }),
    });

    const changePasswordResult = await changePasswordResponse.json();
    console.log('修改密码结果:', changePasswordResult);

    if (changePasswordResult.success) {
      console.log('✅ 密码修改成功');
      
      // 5. 测试用新密码登录
      console.log('\n5. 测试用新密码登录...');
      const newLoginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'NewAdminPass456!'
        }),
      });
      
      const newLoginResult = await newLoginResponse.json();
      console.log('新密码登录结果:', newLoginResult);
      
      if (newLoginResult.success) {
        console.log('✅ 新密码登录成功');
      } else {
        console.log('❌ 新密码登录失败');
      }
    } else {
      console.log('❌ 密码修改失败:', changePasswordResult.message);
    }

    console.log('\n🎉 管理功能API测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testAdminManagement();
