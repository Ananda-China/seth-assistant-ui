const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTokenUsage() {
  console.log('🔍 检查Token使用量数据...');
  
  try {
    // 1. 检查消息表的token_usage字段
    console.log('\n1️⃣ 检查消息表的token_usage字段...');
    
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, content, token_usage, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (messagesError) {
      console.error('❌ 获取消息失败:', messagesError);
      return;
    }

    console.log(`📊 消息总数: ${messages.length}`);
    
    // 统计token使用情况
    const tokenStats = {
      total: messages.length,
      withTokens: messages.filter(m => m.token_usage && m.token_usage > 0).length,
      withoutTokens: messages.filter(m => !m.token_usage || m.token_usage === 0).length,
      totalTokens: messages.reduce((sum, m) => sum + (m.token_usage || 0), 0)
    };

    console.log('\n📈 Token使用统计:');
    console.log(`  - 总消息数: ${tokenStats.total}`);
    console.log(`  - 有Token记录: ${tokenStats.withTokens} 条`);
    console.log(`  - 无Token记录: ${tokenStats.withoutTokens} 条`);
    console.log(`  - 总Token数: ${tokenStats.totalTokens}`);

    console.log('\n📋 最近消息详情:');
    messages.slice(0, 10).forEach((msg, index) => {
      console.log(`  ${index + 1}. ID: ${msg.id.substring(0, 8)}...`);
      console.log(`     内容: ${(msg.content || '').substring(0, 50)}...`);
      console.log(`     Token: ${msg.token_usage || 0}`);
      console.log(`     时间: ${new Date(msg.created_at).toLocaleString()}`);
      console.log('');
    });

    // 2. 检查是否有token_usage字段的问题
    console.log('\n2️⃣ 检查数据库表结构...');
    
    // 尝试查询表结构（PostgreSQL特定）
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'messages' })
      .single();

    if (columnsError) {
      console.log('⚠️ 无法获取表结构信息（这是正常的）');
    } else {
      console.log('📋 表结构信息:', columns);
    }

    // 3. 检查最近是否有新消息
    console.log('\n3️⃣ 检查最近消息活动...');
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: recentMessages, error: recentError } = await supabase
      .from('messages')
      .select('id, token_usage, created_at')
      .gte('created_at', oneWeekAgo.toISOString());

    if (!recentError) {
      const todayMessages = recentMessages.filter(m => 
        new Date(m.created_at) > oneDayAgo
      );
      
      console.log(`📅 最近活动:`);
      console.log(`  - 过去24小时: ${todayMessages.length} 条消息`);
      console.log(`  - 过去7天: ${recentMessages.length} 条消息`);
      
      const recentTokens = recentMessages.reduce((sum, m) => sum + (m.token_usage || 0), 0);
      console.log(`  - 过去7天Token: ${recentTokens}`);
    }

    // 4. 生成修复建议
    console.log('\n4️⃣ 修复建议...');
    
    if (tokenStats.withoutTokens > tokenStats.withTokens) {
      console.log('⚠️ 大部分消息没有Token记录，可能的原因:');
      console.log('  1. Token使用量记录功能可能有问题');
      console.log('  2. 消息是在Token记录功能添加之前创建的');
      console.log('  3. API调用时没有正确记录Token使用量');
    }

    if (tokenStats.totalTokens === 0) {
      console.log('❌ 所有消息的Token使用量都是0，需要检查:');
      console.log('  1. OpenAI API调用是否正确返回token使用量');
      console.log('  2. 消息保存时是否正确记录token_usage字段');
      console.log('  3. 数据库字段类型是否正确');
    }

    console.log('\n✅ Token使用量检查完成！');

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

// 运行检查
checkTokenUsage();
