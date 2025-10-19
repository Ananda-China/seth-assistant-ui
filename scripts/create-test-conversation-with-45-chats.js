import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestConversation() {
  const phone = '17301807380'; // 测试用户
  const chatCount = 45; // 创建45次聊天
  
  console.log(`\n🔧 为用户 ${phone} 创建测试对话（${chatCount}次聊天）...\n`);

  // 1. 查询用户信息
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (userError) {
    console.error('❌ 查询用户失败:', userError.message);
    return;
  }

  console.log('✅ 找到用户:', user.phone);

  // 2. 创建新对话
  const conversationId = crypto.randomUUID();
  const { error: convError } = await supabase
    .from('conversations')
    .insert({
      id: conversationId,
      user_phone: phone,
      title: `测试对话-${chatCount}次聊天`,
      created_at: new Date().toISOString()
    });

  if (convError) {
    console.error('❌ 创建对话失败:', convError.message);
    return;
  }

  console.log('✅ 创建对话成功:', conversationId);

  // 3. 创建45条用户消息和45条AI回复
  console.log(`\n📝 创建 ${chatCount} 次聊天记录...`);
  
  const messages = [];
  for (let i = 1; i <= chatCount; i++) {
    // 用户消息
    messages.push({
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'user',
      content: `测试消息 ${i}`,
      created_at: new Date(Date.now() + i * 1000).toISOString()
    });

    // AI回复
    messages.push({
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'assistant',
      content: `这是对测试消息 ${i} 的回复`,
      created_at: new Date(Date.now() + i * 1000 + 500).toISOString()
    });

    if (i % 10 === 0) {
      console.log(`   已创建 ${i}/${chatCount} 次聊天...`);
    }
  }

  // 批量插入消息
  const { error: msgError } = await supabase
    .from('messages')
    .insert(messages);

  if (msgError) {
    console.error('❌ 创建消息失败:', msgError.message);
    return;
  }

  console.log(`✅ 成功创建 ${chatCount} 次聊天记录`);

  // 4. 验证结果
  console.log('\n🔍 验证结果...');
  
  const { data: verifyMessages, error: verifyError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId);

  if (verifyError) {
    console.error('❌ 验证失败:', verifyError.message);
    return;
  }

  const userMessages = verifyMessages.filter(m => m.role === 'user');
  const assistantMessages = verifyMessages.filter(m => m.role === 'assistant');

  console.log('✅ 验证成功');
  console.log(`   总消息数: ${verifyMessages.length}`);
  console.log(`   用户消息: ${userMessages.length}`);
  console.log(`   AI回复: ${assistantMessages.length}`);
  console.log(`   聊天次数: ${userMessages.length}`);

  if (userMessages.length >= 45) {
    console.log('\n⚠️ 警告: 已达到45次，应该显示警告框');
  }

  console.log('\n✅ 测试对话创建完成！');
  console.log(`\n📋 对话ID: ${conversationId}`);
  console.log('💡 现在可以在浏览器中打开这个对话，查看警告框是否显示\n');
}

createTestConversation().catch(console.error);

