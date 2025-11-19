// 测试脚本：检查analytics API返回的数据
const fetch = require('node-fetch');

async function testAnalyticsData() {
  try {
    console.log('🔍 正在获取analytics数据...\n');
    
    const response = await fetch('http://localhost:3000/api/admin/analytics-supabase');
    const data = await response.json();
    
    console.log('📊 今日活跃排行数据:');
    console.log('='.repeat(80));
    if (data.activity_ranking && data.activity_ranking.length > 0) {
      data.activity_ranking.forEach((user, index) => {
        console.log(`\n${index + 1}. 手机号: ${user.phone}`);
        console.log(`   套餐类型: ${user.plan_type || '❌ 未定义'}`);
        console.log(`   累计聊天: ${user.total_chat_count !== undefined ? user.total_chat_count + '次' : '❌ 未定义'}`);
        console.log(`   今日消息: ${user.today_messages}`);
        console.log(`   Token: ${user.today_tokens}`);
      });
    } else {
      console.log('❌ 没有活跃排行数据');
    }
    
    console.log('\n\n📊 用户订阅提醒数据:');
    console.log('='.repeat(80));
    if (data.subscription_reminders && data.subscription_reminders.length > 0) {
      data.subscription_reminders.forEach((user, index) => {
        console.log(`\n${index + 1}. 手机号: ${user.phone}`);
        console.log(`   套餐类型: ${user.plan || '❌ 未定义'}`);
        console.log(`   累计聊天: ${user.total_chat_count !== undefined ? user.total_chat_count + '次' : '❌ 未定义'}`);
        console.log(`   有效期: ${user.expiry_date || '-'}`);
        console.log(`   对话: ${user.conversations}`);
        console.log(`   消息: ${user.messages}`);
        console.log(`   Token: ${user.tokens}`);
      });
    } else {
      console.log('❌ 没有订阅提醒数据');
    }
    
    console.log('\n\n✅ 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAnalyticsData();

