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

async function checkConversationChatCount() {
  const phone = '13472881751'; // 可以修改为其他用户手机号
  
  console.log(`\n🔍 检查用户 ${phone} 的聊天记录...\n`);

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
  console.log('   昵称:', user.nickname || '未设置');

  // 2. 查询所有对话
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_phone', phone)
    .order('created_at', { ascending: false });

  if (convError) {
    console.error('❌ 查询对话失败:', convError.message);
    return;
  }

  if (!conversations || conversations.length === 0) {
    console.log('\nℹ️ 没有找到对话记录');
    return;
  }

  console.log(`\n✅ 找到 ${conversations.length} 个对话\n`);

  // 3. 逐个检查对话的聊天次数
  for (const conv of conversations) {
    console.log(`📋 对话: ${conv.title || '未命名'}`);
    console.log(`   ID: ${conv.id}`);
    console.log(`   创建时间: ${conv.created_at}`);

    // 查询该对话的所有消息
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('   ❌ 查询消息失败:', msgError.message);
      continue;
    }

    if (!messages || messages.length === 0) {
      console.log('   ℹ️ 没有消息\n');
      continue;
    }

    // 统计用户消息数量
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    console.log(`   总消息数: ${messages.length}`);
    console.log(`   用户消息: ${userMessages.length}`);
    console.log(`   AI回复: ${assistantMessages.length}`);
    console.log(`   聊天次数: ${userMessages.length} (用户发送的消息数)`);

    // 检查是否需要警告
    if (userMessages.length >= 45 && userMessages.length < 50) {
      console.log(`   ⚠️ 警告: 已达到 ${userMessages.length}/50 次，建议创建新对话`);
    } else if (userMessages.length >= 50) {
      console.log(`   🚫 已达到上限: ${userMessages.length}/50 次，无法继续聊天`);
    } else {
      console.log(`   ✅ 正常: ${userMessages.length}/50 次`);
    }

    // 显示最近3条消息
    console.log('   最近消息:');
    const recentMessages = messages.slice(-3);
    recentMessages.forEach((msg, index) => {
      const preview = msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : '');
      console.log(`     ${index + 1}. [${msg.role}] ${preview}`);
    });

    console.log('');
  }

  console.log('✅ 检查完成\n');
}

checkConversationChatCount().catch(console.error);

