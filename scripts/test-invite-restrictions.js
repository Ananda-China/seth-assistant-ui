const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInviteRestrictions() {
  console.log('🔍 测试邀请码限制功能...');
  
  try {
    // 1. 检查现有用户的邀请关系
    console.log('\n1️⃣ 检查现有用户的邀请关系...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('phone, nickname, invited_by')
      .order('created_at', { ascending: false })
      .limit(10);

    if (usersError) {
      console.error('❌ 获取用户失败:', usersError);
      return;
    }

    console.log('📋 用户邀请关系状态:');
    users.forEach(user => {
      console.log(`  - ${user.phone} (${user.nickname || '未设置昵称'})`);
      console.log(`    邀请人: ${user.invited_by || '无'}`);
      console.log(`    状态: ${user.invited_by ? '❌ 不能再填写邀请码' : '✅ 可以填写邀请码'}`);
      console.log('');
    });

    // 2. 测试邀请码检查API
    console.log('\n2️⃣ 测试邀请码检查API...');
    
    // 测试已有邀请关系的用户
    const userWithInvite = users.find(u => u.invited_by);
    if (userWithInvite) {
      console.log(`\n测试用户: ${userWithInvite.phone} (已有邀请人: ${userWithInvite.invited_by})`);
      
      const response1 = await fetch('http://localhost:3000/api/auth/check-invite-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userWithInvite.phone }),
      }).catch(() => null);

      if (response1) {
        const data1 = await response1.json();
        console.log('API响应:', data1);
        console.log(`结果: ${data1.canSetInvite ? '✅ 可以设置' : '❌ 不能设置'}`);
      } else {
        console.log('⚠️ 无法连接到本地API（需要启动开发服务器）');
      }
    }

    // 测试没有邀请关系的用户
    const userWithoutInvite = users.find(u => !u.invited_by);
    if (userWithoutInvite) {
      console.log(`\n测试用户: ${userWithoutInvite.phone} (无邀请人)`);
      
      const response2 = await fetch('http://localhost:3000/api/auth/check-invite-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userWithoutInvite.phone }),
      }).catch(() => null);

      if (response2) {
        const data2 = await response2.json();
        console.log('API响应:', data2);
        console.log(`结果: ${data2.canSetInvite ? '✅ 可以设置' : '❌ 不能设置'}`);
      } else {
        console.log('⚠️ 无法连接到本地API（需要启动开发服务器）');
      }
    }

    // 测试新用户（不存在的手机号）
    console.log(`\n测试新用户: 19999999999 (不存在)`);
    const response3 = await fetch('http://localhost:3000/api/auth/check-invite-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '19999999999' }),
    }).catch(() => null);

    if (response3) {
      const data3 = await response3.json();
      console.log('API响应:', data3);
      console.log(`结果: ${data3.canSetInvite ? '✅ 可以设置' : '❌ 不能设置'}`);
    } else {
      console.log('⚠️ 无法连接到本地API（需要启动开发服务器）');
    }

    // 3. 生成测试报告
    console.log('\n3️⃣ 测试报告...');
    const usersWithInvite = users.filter(u => u.invited_by).length;
    const usersWithoutInvite = users.filter(u => !u.invited_by).length;
    
    console.log(`📊 统计信息:`);
    console.log(`  - 总用户数: ${users.length}`);
    console.log(`  - 有邀请关系: ${usersWithInvite} 个`);
    console.log(`  - 无邀请关系: ${usersWithoutInvite} 个`);
    console.log(`  - 限制比例: ${((usersWithInvite / users.length) * 100).toFixed(1)}%`);

    console.log('\n🌐 生产环境测试地址:');
    console.log('https://seth-assistant-phk56vigg-anandas-projects-049f2ad7.vercel.app/login');
    
    console.log('\n💡 测试建议:');
    console.log('1. 使用已有邀请关系的手机号登录，邀请码输入框应该被禁用');
    console.log('2. 使用新手机号登录，邀请码输入框应该可以正常使用');
    console.log('3. 检查页面显示的提示信息是否正确');

    console.log('\n✅ 邀请码限制功能测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testInviteRestrictions();
