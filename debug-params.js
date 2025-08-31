require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugParams() {
  console.log('🔍 调试参数顺序问题...\n');

  try {
    // 1. 检查conversations表结构
    console.log('📋 检查conversations表结构...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('is_deleted', false)
      .limit(1);
    
    if (convError) {
      console.error('❌ 查询conversations失败:', convError);
      return;
    }
    
    if (conversations.length === 0) {
      console.log('⚠️ 没有找到可测试的对话');
      return;
    }

    const testConv = conversations[0];
    console.log('✅ 找到测试对话:', {
      id: testConv.id,
      title: testConv.title,
      user_phone: testConv.user_phone
    });

    // 2. 测试getConversation函数调用
    console.log('\n🧪 测试getConversation函数...');
    const { data: conv, error: getError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', testConv.id)
      .eq('user_phone', testConv.user_phone)
      .eq('is_deleted', false)
      .single();

    if (getError) {
      console.error('❌ getConversation失败:', getError);
    } else {
      console.log('✅ getConversation成功:', conv.title);
    }

    // 3. 测试listMessages函数调用
    console.log('\n🧪 测试listMessages函数...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', testConv.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('❌ listMessages失败:', msgError);
    } else {
      console.log('✅ listMessages成功，找到消息:', messages.length, '条');
    }

    // 4. 测试addMessage函数调用
    console.log('\n🧪 测试addMessage函数...');
    const { data: newMsg, error: addError } = await supabase
      .from('messages')
      .insert({
        conversation_id: testConv.id,
        role: 'user',
        content: '测试消息'
      })
      .select()
      .single();

    if (addError) {
      console.error('❌ addMessage失败:', addError);
    } else {
      console.log('✅ addMessage成功，消息ID:', newMsg.id);
      
      // 清理测试消息
      await supabase
        .from('messages')
        .delete()
        .eq('id', newMsg.id);
      console.log('🧹 测试消息已清理');
    }

    // 5. 检查所有相关函数的参数顺序
    console.log('\n📋 检查函数参数顺序...');
    console.log('✅ deleteConversation(userPhone, conversationId)');
    console.log('✅ getConversation(userPhone, conversationId)');
    console.log('✅ updateConversationTitle(userPhone, conversationId, title)');
    console.log('✅ setDifyConversationId(userPhone, conversationId, difyConversationId)');
    console.log('✅ getMessages(userPhone, conversationId)');
    console.log('✅ addMessage(userPhone, conversationId, role, content)');
    console.log('✅ ensureConversationTitle(userPhone, conversationId, suggestedTitle)');
    console.log('✅ renameConversation(userPhone, conversationId, title)');
    console.log('✅ listMessages(userPhone, conversationId)');

  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugParams();
