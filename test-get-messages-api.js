require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testGetMessagesAPI() {
  console.log('🔍 测试getMessages API逻辑...\n');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. 获取一个测试对话
    console.log('📋 获取测试对话...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('is_deleted', false)
      .limit(1);

    if (convError || !conversations || conversations.length === 0) {
      console.error('❌ 获取对话失败:', convError);
      return;
    }

    const testConv = conversations[0];
    console.log('✅ 测试对话:', {
      id: testConv.id,
      user_phone: testConv.user_phone,
      title: testConv.title
    });

    // 2. 模拟getConversation函数
    console.log('\n📋 模拟getConversation函数...');
    const { data: conversation, error: getError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', testConv.id)
      .eq('user_phone', testConv.user_phone)
      .eq('is_deleted', false)
      .single();

    if (getError) {
      console.error('❌ getConversation失败:', getError);
      return;
    }
    console.log('✅ getConversation成功');

    // 3. 模拟getMessages函数
    console.log('\n📋 模拟getMessages函数...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', testConv.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('❌ getMessages失败:', msgError);
      return;
    }

    console.log('✅ getMessages成功，找到消息:', messages.length, '条');
    if (messages.length > 0) {
      console.log('消息样本:', messages.slice(0, 3).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content.substring(0, 50) + '...'
      })));
    }

    // 4. 测试完整的API流程
    console.log('\n📋 测试完整的listMessages流程...');
    
    // 导入store-supabase模块
    const storeModule = require('./lib/store-supabase.js');
    
    try {
      const result = await storeModule.listMessages(testConv.user_phone, testConv.id);
      console.log('✅ listMessages成功，返回消息:', result.length, '条');
      if (result.length > 0) {
        console.log('消息样本:', result.slice(0, 3).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content.substring(0, 50) + '...'
        })));
      }
    } catch (err) {
      console.error('❌ listMessages失败:', err.message);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testGetMessagesAPI();

