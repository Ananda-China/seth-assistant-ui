/**
 * 添加定制年卡套餐
 * 价格: 10000元/年
 * 用途: 为定制化客户提供专属年卡套餐
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('请确保 .env.local 文件中包含:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCustomYearlyPlan() {
  console.log('🚀 开始添加定制年卡套餐...\n');

  try {
    // 1. 检查是否已存在定制年卡
    console.log('1️⃣ 检查现有套餐...');
    const { data: existingPlan, error: checkError } = await supabase
      .from('plans')
      .select('*')
      .eq('name', '定制年卡')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ 查询套餐失败:', checkError);
      return;
    }

    if (existingPlan) {
      console.log('📝 定制年卡已存在，将更新套餐信息\n');

      // 2. 更新定制年卡
      console.log('2️⃣ 更新定制年卡套餐...');
      const { data: updatedPlan, error: updateError } = await supabase
        .from('plans')
        .update({
          price: 1000000, // 10000元，单位：分
          duration_days: 365, // 365天
          description: '定制年卡，享受365天专属定制化AI助手服务',
          is_active: true
        })
        .eq('name', '定制年卡')
        .select()
        .single();

      if (updateError) {
        console.error('❌ 更新定制年卡失败:', updateError);
        return;
      }

      console.log('✅ 定制年卡套餐已更新:');
      console.log('   名称:', updatedPlan.name);
      console.log('   价格:', (updatedPlan.price / 100).toFixed(2), '元');
      console.log('   时长:', updatedPlan.duration_days, '天');
      console.log('   描述:', updatedPlan.description);
    } else {
      console.log('📝 定制年卡不存在，将创建新套餐\n');

      // 3. 插入定制年卡套餐
      console.log('3️⃣ 插入定制年卡套餐...');
      const { data: newPlan, error: insertError } = await supabase
        .from('plans')
        .insert({
          name: '定制年卡',
          price: 1000000, // 10000元，单位：分
          duration_days: 365, // 365天
          description: '定制年卡，享受365天专属定制化AI助手服务',
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ 插入定制年卡失败:', insertError);
        return;
      }

      console.log('✅ 定制年卡套餐已创建:');
      console.log('   ID:', newPlan.id);
      console.log('   名称:', newPlan.name);
      console.log('   价格:', (newPlan.price / 100).toFixed(2), '元');
      console.log('   时长:', newPlan.duration_days, '天');
      console.log('   描述:', newPlan.description);
    }

    // 4. 查看所有套餐
    console.log('\n4️⃣ 查看所有套餐...');
    const { data: allPlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (plansError) {
      console.error('❌ 查询套餐失败:', plansError);
      return;
    }

    console.log('\n📋 当前所有套餐:');
    console.log('┌─────────────┬──────────┬──────────┬─────────────────────────────────────┐');
    console.log('│ 套餐名称    │ 价格(元) │ 时长(天) │ 描述                                │');
    console.log('├─────────────┼──────────┼──────────┼─────────────────────────────────────┤');
    allPlans.forEach(plan => {
      const name = plan.name.padEnd(12);
      const price = ((plan.price / 100).toFixed(2) + '元').padEnd(10);
      const duration = (plan.duration_days ? `${plan.duration_days}天` : '不限时').padEnd(10);
      const desc = plan.description.substring(0, 35);
      console.log(`│ ${name}│ ${price}│ ${duration}│ ${desc.padEnd(35)} │`);
    });
    console.log('└─────────────┴──────────┴──────────┴─────────────────────────────────────┘');

    console.log('\n✅ 定制年卡套餐添加完成！');
    console.log('\n📝 下一步:');
    console.log('   1. 在管理后台的"激活码管理"页面');
    console.log('   2. 选择"定制年卡"套餐');
    console.log('   3. 生成激活码');
    console.log('   4. 将激活码分配给定制化客户');

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

// 执行脚本
addCustomYearlyPlan();

