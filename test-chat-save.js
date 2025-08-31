// 测试聊天记录保存功能
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testChatSave() {
  console.log('🔍 测试聊天记录保存功能...\n');

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📊 检查Supabase聊天数据...\n');

    // 获取对话数据
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (convError) {
      console.log('❌ 获取对话数据失败:', convError.message);
      return;
    }

    console.log(`💬 对话总数: ${conversations.length}`);
    
    if (conversations.length === 0) {
      console.log('⚠️ 没有对话数据，这可能是问题的原因');
    } else {
      console.log('✅ 发现对话数据:');
      conversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. ${conv.title} (用户: ${conv.user_phone}) - 创建时间: ${conv.created_at}`);
      });
    }

    // 获取消息数据
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (msgError) {
      console.log('❌ 获取消息数据失败:', msgError.message);
      return;
    }

    console.log(`\n💭 消息总数: ${messages.length}`);
    
    if (messages.length === 0) {
      console.log('⚠️ 没有消息数据，这可能是问题的原因');
    } else {
      console.log('✅ 发现消息数据:');
      messages.slice(0, 5).forEach((msg, index) => {
        console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}... (对话ID: ${msg.conversation_id})`);
      });
    }

    // 获取用户数据
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('phone, nickname');
    
    if (userError) {
      console.log('❌ 获取用户数据失败:', userError.message);
      return;
    }

    console.log(`\n👥 用户总数: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.phone} (${user.nickname || '未设置昵称'})`);
    });

    console.log('\n🔍 问题诊断:');
    
    if (conversations.length === 0 && messages.length === 0) {
      console.log('❌ 主要问题: 聊天记录完全没有保存到数据库');
      console.log('💡 可能原因:');
      console.log('  1. 对话创建API仍在使用本地存储');
      console.log('  2. 消息保存API仍在使用本地存储');
      console.log('  3. Supabase配置问题');
      console.log('  4. 数据库权限问题');
    } else if (conversations.length > 0 && messages.length === 0) {
      console.log('⚠️ 部分问题: 对话已创建，但消息未保存');
      console.log('💡 可能原因: 消息保存API仍在使用本地存储');
    } else if (conversations.length === 0 && messages.length > 0) {
      console.log('⚠️ 部分问题: 消息已保存，但对话未创建');
      console.log('💡 可能原因: 对话创建API仍在使用本地存储');
    } else {
      console.log('✅ 聊天记录保存正常');
    }

    console.log('\n🧹 修复建议:');
    console.log('1. 确认所有聊天相关API都使用配置模块');
    console.log('2. 检查环境变量 USE_SUPABASE=true');
    console.log('3. 测试新建对话和发送消息');
    console.log('4. 检查浏览器控制台是否有错误');

  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testChatSave();
