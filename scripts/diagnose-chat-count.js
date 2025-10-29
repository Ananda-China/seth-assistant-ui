#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseUser(phone) {
  console.log(`\n🔍 诊断用户 ${phone}...\n`);

  try {
    // 1. 获取用户信息
    console.log('1️⃣ 获取用户信息...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      console.error('❌ 用户不存在:', userError?.message);
      return;
    }

    console.log('✅ 用户信息:');
    console.log(`   电话: ${user.phone}`);
    console.log(`   chat_count: ${user.chat_count}`);
    console.log(`   subscription_type: ${user.subscription_type}`);
    console.log(`   subscription_start: ${user.subscription_start}`);
    console.log(`   subscription_end: ${user.subscription_end}`);
    console.log(`   created_at: ${user.created_at}`);

    // 2. 获取用户的所有对话（包括已删除的）
    console.log('\n2️⃣ 获取用户的所有对话...');
    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_phone', phone)
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('❌ 获取对话失败:', convError.message);
      return;
    }

    const conversations = allConversations.filter(c => !c.is_deleted);
    const deletedConversations = allConversations.filter(c => c.is_deleted);

    console.log(`✅ 找到 ${allConversations.length} 个对话（${conversations.length} 个未删除，${deletedConversations.length} 个已删除）`);

    conversations.forEach((conv, idx) => {
      console.log(`   ${idx + 1}. ${conv.title || '(无标题)'} - 创建于 ${conv.created_at}`);
    });

    if (deletedConversations.length > 0) {
      console.log(`\n⚠️  已删除的对话 (${deletedConversations.length} 个):`);
      deletedConversations.forEach((conv, idx) => {
        console.log(`   ${idx + 1}. ${conv.title || '(无标题)'} - 创建于 ${conv.created_at}`);
      });
    }

    // 3. 获取所有消息并统计
    console.log('\n3️⃣ 获取所有消息...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversations.map(c => c.id))
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('❌ 获取消息失败:', msgError.message);
      return;
    }

    console.log(`✅ 找到 ${messages.length} 条消息`);

    // 4. 按对话统计消息
    console.log('\n4️⃣ 按对话统计消息:');
    const messagesByConv = {};
    conversations.forEach(conv => {
      messagesByConv[conv.id] = {
        title: conv.title || '(无标题)',
        created_at: conv.created_at,
        user: 0,
        assistant: 0,
        total: 0,
        messages: []
      };
    });

    messages.forEach(msg => {
      if (messagesByConv[msg.conversation_id]) {
        messagesByConv[msg.conversation_id].total++;
        messagesByConv[msg.conversation_id].messages.push({
          role: msg.role,
          created_at: msg.created_at,
          content: msg.content?.substring(0, 50) || '(空)'
        });
        if (msg.role === 'user') {
          messagesByConv[msg.conversation_id].user++;
        } else if (msg.role === 'assistant') {
          messagesByConv[msg.conversation_id].assistant++;
        }
      }
    });

    Object.entries(messagesByConv).forEach(([convId, stats]) => {
      console.log(`   ${stats.title} (创建于 ${stats.created_at}):`);
      console.log(`      用户消息: ${stats.user}`);
      console.log(`      AI消息: ${stats.assistant}`);
      console.log(`      总计: ${stats.total}`);
      console.log(`      消息详情:`);
      stats.messages.forEach((msg, idx) => {
        console.log(`        ${idx + 1}. [${msg.role}] ${msg.created_at} - ${msg.content}`);
      });
    });

    // 5. 计算统计信息
    console.log('\n5️⃣ 统计信息:');
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    const estimatedChats = Math.ceil(userMessages); // 每个用户消息 = 1 次对话

    console.log(`   总消息数: ${totalMessages}`);
    console.log(`   用户消息数: ${userMessages}`);
    console.log(`   AI消息数: ${assistantMessages}`);
    console.log(`   预期 chat_count (基于用户消息): ${estimatedChats}`);
    console.log(`   实际 chat_count: ${user.chat_count}`);
    console.log(`   差异: ${user.chat_count - estimatedChats}`);

    // 6. 分析问题
    console.log('\n6️⃣ 问题分析:');
    if (user.chat_count > estimatedChats) {
      console.log(`   ⚠️  chat_count (${user.chat_count}) > 预期值 (${estimatedChats})`);
      console.log(`   可能原因:`);
      console.log(`   1. 用户快速发送消息，导致竞态条件`);
      console.log(`   2. 某些消息被删除了，但 chat_count 没有相应减少`);
      console.log(`   3. 前端重复发送了请求`);
    } else if (user.chat_count < estimatedChats) {
      console.log(`   ⚠️  chat_count (${user.chat_count}) < 预期值 (${estimatedChats})`);
      console.log(`   可能原因:`);
      console.log(`   1. chat_count 没有正确更新`);
      console.log(`   2. 某些消息是手动添加的，没有增加 chat_count`);
    } else {
      console.log(`   ✅ chat_count 与实际消息数一致`);
    }

    // 7. 建议修复
    console.log('\n7️⃣ 建议修复:');
    if (user.chat_count !== estimatedChats) {
      console.log(`   运行以下命令修复:`);
      console.log(`   node scripts/fix-user-chat-count.js ${phone}`);
    }

  } catch (error) {
    console.error('❌ 发生错误:', error);
  }
}

// 获取命令行参数
const phone = process.argv[2];
if (!phone) {
  console.error('❌ 请提供电话号码');
  console.error('用法: node scripts/diagnose-chat-count.js <phone>');
  process.exit(1);
}

diagnoseUser(phone);

