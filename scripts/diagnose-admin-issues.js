const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseAdminIssues() {
  console.log('🔍 诊断管理后台问题...');
  
  try {
    // 1. 检查数据库连接和数据
    console.log('\n1️⃣ 检查数据库连接和数据...');
    
    // 检查激活码数据
    const { data: codes, error: codesError } = await supabase
      .from('activation_codes')
      .select('*')
      .limit(5);

    console.log('激活码数据:', {
      count: codes?.length || 0,
      error: codesError,
      sample: codes?.[0]
    });

    // 检查用户数据
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('phone, nickname, subscription_type')
      .limit(5);

    console.log('用户数据:', {
      count: users?.length || 0,
      error: usersError,
      sample: users?.[0]
    });

    // 检查消息数据
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, token_usage, created_at')
      .limit(5);

    console.log('消息数据:', {
      count: messages?.length || 0,
      error: messagesError,
      sample: messages?.[0]
    });

    // 2. 测试生产环境API
    console.log('\n2️⃣ 测试生产环境API...');
    
    const baseUrl = 'https://seth-assistant-phk56vigg-anandas-projects-049f2ad7.vercel.app';
    
    // 测试激活码API（无认证）
    console.log('\n测试调试激活码API...');
    try {
      const debugResponse = await fetch(`${baseUrl}/api/debug/activation-codes`);
      console.log('调试API状态:', debugResponse.status);
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('调试API响应:', {
          success: debugData.success,
          codesCount: debugData.codes?.length || 0,
          message: debugData.message
        });
      } else {
        const errorText = await debugResponse.text();
        console.log('调试API错误:', errorText);
      }
    } catch (error) {
      console.log('调试API请求失败:', error.message);
    }

    // 3. 检查管理员认证问题
    console.log('\n3️⃣ 检查管理员认证问题...');
    
    // 测试管理员登录
    console.log('\n测试管理员登录...');
    try {
      const loginResponse = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });

      console.log('登录API状态:', loginResponse.status);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('登录成功:', loginData.success);
        
        // 获取cookie
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('Cookie设置:', !!cookies);
        
        if (cookies) {
          // 使用cookie测试激活码API
          console.log('\n使用认证cookie测试激活码API...');
          const authResponse = await fetch(`${baseUrl}/api/admin/activation-codes`, {
            headers: { 'Cookie': cookies }
          });
          
          console.log('认证API状态:', authResponse.status);
          
          if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('认证API响应:', {
              success: authData.success,
              codesCount: authData.codes?.length || 0,
              message: authData.message
            });
          } else {
            const errorText = await authResponse.text();
            console.log('认证API错误:', errorText);
          }
        }
      } else {
        const errorText = await loginResponse.text();
        console.log('登录失败:', errorText);
      }
    } catch (error) {
      console.log('登录请求失败:', error.message);
    }

    // 4. 生成诊断报告
    console.log('\n4️⃣ 诊断报告...');
    
    console.log('📊 数据库状态:');
    console.log(`  - 激活码: ${codes?.length || 0} 条`);
    console.log(`  - 用户: ${users?.length || 0} 条`);
    console.log(`  - 消息: ${messages?.length || 0} 条`);
    
    console.log('\n🔧 可能的问题:');
    if (codesError) {
      console.log('  ❌ 激活码表查询失败');
    }
    if (usersError) {
      console.log('  ❌ 用户表查询失败');
    }
    if (messagesError) {
      console.log('  ❌ 消息表查询失败');
    }
    
    console.log('\n💡 建议解决方案:');
    console.log('  1. 检查生产环境的环境变量配置');
    console.log('  2. 检查Supabase数据库连接');
    console.log('  3. 检查管理员认证cookie设置');
    console.log('  4. 检查API路由的权限验证');

    console.log('\n🌐 测试地址:');
    console.log(`  - 管理后台: ${baseUrl}/admin`);
    console.log(`  - 调试API: ${baseUrl}/api/debug/activation-codes`);
    console.log(`  - 登录页面: ${baseUrl}/admin/login`);

    console.log('\n✅ 诊断完成！');

  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error);
  }
}

// 运行诊断
diagnoseAdminIssues();
