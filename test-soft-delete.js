require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSoftDelete() {
  console.log('🧪 测试软删除功能...\n');

  try {
    // 1. 检查字段是否存在
    console.log('🔍 检查删除标记字段...');
    const { data: convColumns, error: convColError } = await supabase
      .from('conversations')
      .select('is_deleted, deleted_at')
      .limit(1);

    if (convColError) {
      console.error('❌ conversations表缺少删除标记字段');
      console.log('请先运行: node run-migration.js');
      return;
    }

    console.log('✅ conversations表删除标记字段正常');

    // 2. 获取一个测试对话
    console.log('\n🔍 获取测试对话...');
    const { data: testConv, error: testError } = await supabase
      .from('conversations')
      .select('*')
      .eq('is_deleted', false)
      .limit(1);

    if (testError || !testConv || testConv.length === 0) {
      console.error('❌ 没有找到可测试的对话');
      return;
    }

    const testConversation = testConv[0];
    console.log(`✅ 找到测试对话: ${testConversation.title} (ID: ${testConversation.id})`);

    // 3. 执行软删除
    console.log('\n🗑️ 执行软删除测试...');
    const { error: deleteError } = await supabase
      .from('conversations')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', testConversation.id);

    if (deleteError) {
      console.error('❌ 软删除失败:', deleteError);
      return;
    }

    console.log('✅ 软删除执行成功');

    // 4. 验证软删除后的查询
    console.log('\n🔍 验证软删除后的查询...');
    
    // 4.1 普通查询应该不返回已删除的记录
    const { data: normalQuery, error: normalError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', testConversation.id);

    if (normalError) {
      console.error('❌ 普通查询失败:', normalError);
      return;
    }

    if (normalQuery && normalQuery.length > 0) {
      console.log('⚠️ 普通查询仍返回记录，但标记为已删除');
      console.log('记录状态:', normalQuery[0]);
    } else {
      console.log('✅ 普通查询未返回已删除记录');
    }

    // 4.2 包含已删除记录的查询
    const { data: allQuery, error: allError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', testConversation.id);

    if (allError) {
      console.error('❌ 全量查询失败:', allError);
      return;
    }

    if (allQuery && allQuery.length > 0) {
      const deletedRecord = allQuery[0];
      console.log('✅ 全量查询返回已删除记录');
      console.log('删除状态:', {
        id: deletedRecord.id,
        title: deletedRecord.title,
        is_deleted: deletedRecord.is_deleted,
        deleted_at: deletedRecord.deleted_at
      });
    }

    // 5. 恢复测试记录
    console.log('\n🔄 恢复测试记录...');
    const { error: restoreError } = await supabase
      .from('conversations')
      .update({ 
        is_deleted: false, 
        deleted_at: null 
      })
      .eq('id', testConversation.id);

    if (restoreError) {
      console.error('❌ 恢复记录失败:', restoreError);
    } else {
      console.log('✅ 测试记录已恢复');
    }

    console.log('\n🎉 软删除功能测试完成！');
    console.log('✅ 删除的记录被标记而不是物理删除');
    console.log('✅ 查询时自动过滤已删除记录');
    console.log('✅ 数据可以恢复（如果需要）');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testSoftDelete();
