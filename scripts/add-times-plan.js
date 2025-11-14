/**
 * 添加次卡套餐到数据库
 * 运行方式: node scripts/add-times-plan.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTimesPlan() {
  console.log('🚀 开始添加次卡套餐...\n');

  try {
    // 1. 检查plans表结构
    console.log('1️⃣ 检查plans表结构...');
    const { data: existingPlans, error: checkError } = await supabase
      .from('plans')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ 检查plans表失败:', checkError);
      return;
    }
    console.log('✅ plans表存在\n');

    // 2. 检查是否已存在次卡套餐
    console.log('2️⃣ 检查是否已存在次卡套餐...');
    const { data: existingTimesPlan, error: existError } = await supabase
      .from('plans')
      .select('*')
      .eq('name', '次卡')
      .single();

    if (existingTimesPlan) {
      console.log('⚠️  次卡套餐已存在，将更新价格');
      
      // 更新现有次卡
      const { data: updatedPlan, error: updateError } = await supabase
        .from('plans')
        .update({
          price: 3990, // 39.9元
          duration_days: null, // 不限制时间
          description: '次卡，享受50次AI助手服务，不限制时间',
          is_active: true
        })
        .eq('name', '次卡')
        .select()
        .single();

      if (updateError) {
        console.error('❌ 更新次卡失败:', updateError);
        return;
      }

      console.log('✅ 次卡套餐已更新:');
      console.log('   名称:', updatedPlan.name);
      console.log('   价格:', (updatedPlan.price / 100).toFixed(2), '元');
      console.log('   时长:', updatedPlan.duration_days || '不限制时间');
      console.log('   描述:', updatedPlan.description);
    } else {
      console.log('📝 次卡套餐不存在，将创建新套餐\n');

      // 3. 插入次卡套餐
      console.log('3️⃣ 插入次卡套餐...');
      const { data: newPlan, error: insertError } = await supabase
        .from('plans')
        .insert({
          name: '次卡',
          price: 3990, // 39.9元，单位：分
          duration_days: null, // 不限制时间
          description: '次卡，享受50次AI助手服务，不限制时间',
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ 插入次卡失败:', insertError);
        return;
      }

      console.log('✅ 次卡套餐已创建:');
      console.log('   ID:', newPlan.id);
      console.log('   名称:', newPlan.name);
      console.log('   价格:', (newPlan.price / 100).toFixed(2), '元');
      console.log('   时长:', newPlan.duration_days || '不限制时间');
      console.log('   描述:', newPlan.description);
    }

    // 4. 更新月卡价格为899元
    console.log('\n4️⃣ 更新月卡价格...');
    const { data: monthlyPlan, error: monthlyError } = await supabase
      .from('plans')
      .update({ price: 89900 }) // 899元
      .eq('name', '月套餐')
      .select()
      .single();

    if (monthlyError) {
      console.error('❌ 更新月卡价格失败:', monthlyError);
    } else {
      console.log('✅ 月卡价格已更新为:', (monthlyPlan.price / 100).toFixed(2), '元');
    }

    // 5. 显示所有套餐
    console.log('\n5️⃣ 当前所有套餐:');
    const { data: allPlans, error: allError } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (allError) {
      console.error('❌ 获取套餐列表失败:', allError);
      return;
    }

    console.log('\n套餐列表:');
    console.log('─'.repeat(80));
    console.log('名称\t\t价格\t\t时长\t\t状态');
    console.log('─'.repeat(80));
    allPlans.forEach(plan => {
      const price = (plan.price / 100).toFixed(2);
      const duration = plan.duration_days ? `${plan.duration_days}天` : '不限制时间';
      const status = plan.is_active ? '启用' : '禁用';
      console.log(`${plan.name}\t\t¥${price}\t\t${duration}\t\t${status}`);
    });
    console.log('─'.repeat(80));

    console.log('\n✅ 次卡套餐添加完成！');
    console.log('\n📝 下一步:');
    console.log('   1. 在管理后台的激活码管理中，现在可以选择次卡套餐');
    console.log('   2. 生成次卡激活码');
    console.log('   3. 用户可以使用次卡激活码激活50次聊天');

  } catch (error) {
    console.error('❌ 发生错误:', error);
  }
}

// 运行脚本
addTimesPlan();

