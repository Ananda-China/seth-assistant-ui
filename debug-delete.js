require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDelete() {
  console.log('🔍 调试删除功能...\n');

  try {
    // 1. 检查conversations表结构
    console.log('📋 检查conversations表结构...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('is_deleted', false)
      .limit(3);
    
    if (convError) {
      console.error('❌ 查询conversations失败:', convError);
      return;
    }
    
    console.log('✅ 找到对话:', conversations.length, '个');
    conversations.forEach((conv, index) => {
      console.log(`${index + 1}. ID: ${conv.id}, 标题: ${conv.title}, 用户: ${conv.user_phone}`);
    });

    if (conversations.length === 0) {
      console.log('⚠️ 没有找到可测试的对话');
      return;
    }

    // 2. 测试删除功能
    const testConv = conversations[0];
    console.log(`\n🧪 测试删除对话: ${testConv.title} (ID: ${testConv.id})`);
    
    // 直接调用deleteConversation函数
    const { error: deleteError } = await supabase
      .from('conversations')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', testConv.id)
      .eq('user_phone', testConv.user_phone);

    if (deleteError) {
      console.error('❌ 删除失败:', deleteError);
      console.log('错误详情:', {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details
      });
    } else {
      console.log('✅ 删除成功');
      
      // 3. 验证删除结果
      console.log('\n🔍 验证删除结果...');
      const { data: deletedConv, error: verifyError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', testConv.id);
      
      if (verifyError) {
        console.error('❌ 验证失败:', verifyError);
      } else if (deletedConv && deletedConv.length > 0) {
        const conv = deletedConv[0];
        console.log('✅ 删除验证成功:', {
          id: conv.id,
          title: conv.title,
          is_deleted: conv.is_deleted,
          deleted_at: conv.deleted_at
        });
      }
      
      // 4. 恢复测试记录
      console.log('\n🔄 恢复测试记录...');
      const { error: restoreError } = await supabase
        .from('conversations')
        .update({ 
          is_deleted: false, 
          deleted_at: null 
        })
        .eq('id', testConv.id);
      
      if (restoreError) {
        console.error('❌ 恢复失败:', restoreError);
      } else {
        console.log('✅ 测试记录已恢复');
      }
    }

  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugDelete();
