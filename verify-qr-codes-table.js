// 验证qr_codes表是否创建成功
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n🔍 验证 qr_codes 表...\n');

  try {
    // 查询表
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ 表不存在或查询失败:', error.message);
      console.error('错误详情:', error);
      return false;
    }

    console.log('✅ qr_codes 表已存在！');
    console.log('📊 当前记录数:', data.length);
    
    if (data.length > 0) {
      console.log('\n记录列表：');
      data.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name}`);
        console.log('   ID:', item.id);
        console.log('   URL:', item.url.substring(0, 50) + (item.url.length > 50 ? '...' : ''));
        console.log('   描述:', item.description || '无');
        console.log('   状态:', item.is_active ? '启用' : '禁用');
        console.log('   创建时间:', new Date(item.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      });
    } else {
      console.log('\n⚠️ 表中暂无数据');
    }

    return true;
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    return false;
  }
}

verifyTable()
  .then(success => {
    if (success) {
      console.log('\n✅ 验证完成！qr_codes表已就绪，可以正常使用。\n');
    } else {
      console.log('\n❌ 验证失败，请检查Supabase配置。\n');
    }
  })
  .catch(console.error);

