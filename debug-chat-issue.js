require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugChatIssue() {
  console.log('🔍 诊断聊天问题...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. 获取最近的对话
    console.log('📋 获取最近的对话...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (convError) {
      console.error('❌ 获取对话失败:', convError);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.log('⚠️ 没有对话数据');
      return;
    }

    const conv = conversations[0];
    console.log('✅ 找到对话:', {
      id: conv.id,
      title: conv.title,
      user_phone: conv.user_phone,
      created_at: conv.created_at,
      updated_at: conv.updated_at
    });

    // 2. 获取该对话的所有消息
    console.log('\n📋 获取对话的消息...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('❌ 获取消息失败:', msgError);
      return;
    }

    console.log(`✅ 找到 ${messages.length} 条消息`);

    // 3. 分析消息
    console.log('\n📊 消息分析:');
    let totalLength = 0;
    let userCount = 0;
    let assistantCount = 0;

    messages.forEach((msg, index) => {
      const contentLength = msg.content?.length || 0;
      totalLength += contentLength;
      
      if (msg.role === 'user') userCount++;
      if (msg.role === 'assistant') assistantCount++;

      console.log(`\n[${index + 1}] ${msg.role.toUpperCase()}`);
      console.log(`    ID: ${msg.id}`);
      console.log(`    长度: ${contentLength} 字符`);
      console.log(`    Token: ${msg.token_usage || 0}`);
      console.log(`    创建时间: ${msg.created_at}`);
      console.log(`    预览: ${msg.content?.substring(0, 100)}${contentLength > 100 ? '...' : ''}`);
      
      // 检查是否有截断迹象
      if (msg.role === 'assistant' && contentLength > 0) {
        const lastChar = msg.content[msg.content.length - 1];
        const hasEndPunctuation = /[。！？.!?]$/.test(msg.content.trim());
        console.log(`    结尾字符: '${lastChar}' (${hasEndPunctuation ? '✅ 有结束标点' : '⚠️ 无结束标点'})`);
      }
    });

    console.log('\n📈 统计:');
    console.log(`总消息数: ${messages.length}`);
    console.log(`用户消息: ${userCount}`);
    console.log(`AI消息: ${assistantCount}`);
    console.log(`总字符数: ${totalLength}`);
    console.log(`平均消息长度: ${(totalLength / messages.length).toFixed(0)} 字符`);

    // 4. 检查最后一条消息
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log('\n🔍 最后一条消息详情:');
      console.log(`角色: ${lastMsg.role}`);
      console.log(`长度: ${lastMsg.content?.length || 0} 字符`);
      console.log(`完整内容:\n${lastMsg.content}`);
    }

  } catch (error) {
    console.error('❌ 诊断失败:', error);
  }
}

debugChatIssue();

