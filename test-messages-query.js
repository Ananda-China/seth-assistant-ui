require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testMessagesQuery() {
  console.log('🔍 测试消息查询...\n');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. 查询所有消息（不带is_deleted过滤）
    console.log('📋 查询所有消息（不带is_deleted过滤）...');
    const { data: allMessages, error: allError } = await supabase
      .from('messages')
      .select('id, conversation_id, role, is_deleted')
      .limit(5);

    if (allError) {
      console.error('❌ 查询失败:', allError);
    } else {
      console.log('✅ 找到消息:', allMessages.length, '条');
      console.log('消息样本:', allMessages);
    }

    // 2. 查询带is_deleted=false过滤的消息
    console.log('\n📋 查询消息（带is_deleted=false过滤）...');
    const { data: filteredMessages, error: filteredError } = await supabase
      .from('messages')
      .select('id, conversation_id, role, is_deleted')
      .eq('is_deleted', false)
      .limit(5);

    if (filteredError) {
      console.error('❌ 查询失败:', filteredError);
    } else {
      console.log('✅ 找到消息:', filteredMessages.length, '条');
      console.log('消息样本:', filteredMessages);
    }

    // 3. 检查messages表的结构
    console.log('\n📋 检查messages表结构...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ 查询失败:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('✅ 表字段:', Object.keys(tableInfo[0]));
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testMessagesQuery();

