require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseUser(phone) {
  console.log('🔍 诊断用户:', phone);
  console.log('='.repeat(80));

  try {
    // 1. 检查用户信息
    console.log('\n1️⃣ 用户信息:');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError) {
      console.error('❌ 用户不存在:', userError.message);
      return;
    }

    console.log('✅ 用户存在:', {
      phone: user.phone,
      nickname: user.nickname,
      subscription_type: user.subscription_type,
      chat_count: user.chat_count,
      chat_limit: user.chat_limit
    });

    // 2. 检查所有对话（包括已删除的）
    console.log('\n2️⃣ 对话列表（包括已删除）:');
    const { data: allConversations, error: allConvError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_phone', phone)
      .order('updated_at', { ascending: false });

    if (allConvError) {
      console.error('❌ 查询对话失败:', allConvError.message);
    } else {
      console.log(`📊 总对话数: ${allConversations.length}`);
      allConversations.forEach((conv, index) => {
        console.log(`\n对话 ${index + 1}:`);
        console.log(`  ID: ${conv.id}`);
        console.log(`  标题: ${conv.title}`);
        console.log(`  是否删除: ${conv.is_deleted ? '✅ 已删除' : '❌ 未删除'}`);
        console.log(`  删除时间: ${conv.deleted_at || 'N/A'}`);
        console.log(`  创建时间: ${conv.created_at}`);
        console.log(`  更新时间: ${conv.updated_at}`);
        console.log(`  Dify对话ID: ${conv.dify_conversation_id || 'N/A'}`);
      });
    }

    // 3. 检查未删除的对话
    console.log('\n3️⃣ 未删除的对话:');
    const { data: activeConversations, error: activeConvError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_phone', phone)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (activeConvError) {
      console.error('❌ 查询未删除对话失败:', activeConvError.message);
    } else {
      console.log(`📊 未删除对话数: ${activeConversations.length}`);
      if (activeConversations.length === 0) {
        console.log('⚠️  没有未删除的对话！这就是为什么左侧显示"余额/激活..."');
      }
    }

    // 4. 检查每个对话的消息
    console.log('\n4️⃣ 对话消息详情:');
    for (const conv of allConversations) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error(`❌ 查询对话 ${conv.id} 的消息失败:`, msgError.message);
      } else {
        console.log(`\n对话: ${conv.title} (${conv.id})`);
        console.log(`  对话状态: ${conv.is_deleted ? '已删除' : '未删除'}`);
        console.log(`  消息数: ${messages.length}`);
        
        messages.forEach((msg, index) => {
          console.log(`  消息 ${index + 1}:`);
          console.log(`    角色: ${msg.role}`);
          console.log(`    内容: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
          console.log(`    是否删除: ${msg.is_deleted ? '已删除' : '未删除'}`);
          console.log(`    创建时间: ${msg.created_at}`);
        });
      }
    }

    // 5. 检查是否有孤立的消息（对话被删除但消息未删除）
    console.log('\n5️⃣ 检查数据一致性:');
    const deletedConvIds = allConversations
      .filter(c => c.is_deleted)
      .map(c => c.id);

    if (deletedConvIds.length > 0) {
      const { data: orphanMessages, error: orphanError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', deletedConvIds)
        .eq('is_deleted', false);

      if (orphanError) {
        console.error('❌ 查询孤立消息失败:', orphanError.message);
      } else if (orphanMessages.length > 0) {
        console.log(`⚠️  发现 ${orphanMessages.length} 条孤立消息（对话已删除但消息未删除）`);
        console.log('这可能导致数据不一致！');
      } else {
        console.log('✅ 没有孤立消息');
      }
    }

    // 6. 建议修复方案
    console.log('\n6️⃣ 修复建议:');
    if (activeConversations.length === 0 && allConversations.length > 0) {
      console.log('⚠️  所有对话都被标记为已删除！');
      console.log('修复方案：');
      console.log('1. 恢复所有对话：');
      console.log(`   UPDATE conversations SET is_deleted = false, deleted_at = NULL WHERE user_phone = '${phone}';`);
      console.log('2. 或者只恢复最近的对话：');
      console.log(`   UPDATE conversations SET is_deleted = false, deleted_at = NULL WHERE user_phone = '${phone}' AND id = '${allConversations[0].id}';`);
    }

  } catch (error) {
    console.error('❌ 诊断失败:', error);
  }
}

// 从命令行参数获取手机号
const phone = process.argv[2] || '13828472314';
diagnoseUser(phone);

