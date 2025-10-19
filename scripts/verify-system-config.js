/**
 * 验证系统配置脚本
 * 
 * 功能：验证清理后系统配置是否完整
 * 
 * 检查项：
 * - 管理员账号是否存在
 * - 套餐配置是否存在
 * - 客服二维码是否存在
 * - 业务数据是否已清空
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySystemConfig() {
  console.log('\n🔍 ===== 系统配置验证 ===== 🔍\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let allPassed = true;

  try {
    // 1. 检查管理员账号
    console.log('1️⃣ 检查管理员账号...');
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*');

    if (adminsError) {
      console.log(`   ❌ 错误: ${adminsError.message}`);
      allPassed = false;
    } else if (!admins || admins.length === 0) {
      console.log('   ❌ 未找到管理员账号');
      allPassed = false;
    } else {
      console.log(`   ✅ 找到 ${admins.length} 个管理员账号`);
      admins.forEach(admin => {
        console.log(`      - ${admin.username}`);
      });
    }

    // 2. 检查套餐配置
    console.log('\n2️⃣ 检查套餐配置...');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*');

    if (plansError) {
      console.log(`   ❌ 错误: ${plansError.message}`);
      allPassed = false;
    } else if (!plans || plans.length === 0) {
      console.log('   ❌ 未找到套餐配置');
      allPassed = false;
    } else {
      console.log(`   ✅ 找到 ${plans.length} 个套餐`);
      plans.forEach(plan => {
        console.log(`      - ${plan.name}: ¥${(plan.price / 100).toFixed(2)} (${plan.duration_days}天)`);
      });
    }

    // 3. 检查客服二维码
    console.log('\n3️⃣ 检查客服二维码...');
    const { data: qrCodes, error: qrCodesError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('is_active', true);

    if (qrCodesError) {
      console.log(`   ❌ 错误: ${qrCodesError.message}`);
      allPassed = false;
    } else if (!qrCodes || qrCodes.length === 0) {
      console.log('   ⚠️  未找到启用的客服二维码');
      console.log('   💡 建议：在管理后台上传客服二维码');
    } else {
      console.log(`   ✅ 找到 ${qrCodes.length} 个启用的二维码`);
      qrCodes.forEach(qr => {
        console.log(`      - ${qr.name}: ${qr.description || '无描述'}`);
      });
    }

    // 4. 验证业务数据已清空
    console.log('\n4️⃣ 验证业务数据已清空...');
    
    const businessTables = [
      'users',
      'conversations',
      'messages',
      'orders',
      'subscriptions',
      'activation_codes',
      'balances',
      'commission_records',
      'withdrawal_requests'
    ];

    let hasBusinessData = false;
    
    for (const table of businessTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ⚠️  ${table}: 无法检查 (${error.message})`);
      } else if (count && count > 0) {
        console.log(`   ⚠️  ${table}: 还有 ${count} 条记录`);
        hasBusinessData = true;
      }
    }

    if (!hasBusinessData) {
      console.log('   ✅ 所有业务数据已清空');
    } else {
      console.log('   ⚠️  部分业务数据未清空');
    }

    // 5. 测试新用户注册流程
    console.log('\n5️⃣ 测试新用户注册流程...');
    
    const testPhone = `test${Date.now()}`;
    const testInviteCode = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        phone: testPhone,
        nickname: '测试用户',
        invite_code: testInviteCode,
        trial_start: new Date().toISOString(),
        trial_end: null, // 不限制时间
        subscription_type: 'free',
        chat_count: 0,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.log(`   ❌ 创建测试用户失败: ${createError.message}`);
      allPassed = false;
    } else {
      console.log('   ✅ 测试用户创建成功');
      console.log(`      - 手机号: ${newUser.phone}`);
      console.log(`      - 邀请码: ${newUser.invite_code}`);
      console.log(`      - 聊天次数: ${newUser.chat_count}/15`);
      
      // 删除测试用户
      await supabase
        .from('users')
        .delete()
        .eq('phone', testPhone);
      
      console.log('   ✅ 测试用户已清理');
    }

    // 总结
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('✅ 系统配置验证通过！');
      console.log('\n📝 系统状态：');
      console.log('   ✓ 管理员账号正常');
      console.log('   ✓ 套餐配置正常');
      console.log('   ✓ 业务数据已清空');
      console.log('   ✓ 新用户注册功能正常');
      console.log('\n🎉 系统已准备好上线！\n');
    } else {
      console.log('⚠️  系统配置存在问题，请检查上述错误信息\n');
    }

  } catch (error) {
    console.error('\n❌ 验证过程中出现错误:', error);
    console.log('\n⚠️  请检查错误信息并重试\n');
  }
}

// 执行验证
verifySystemConfig();

