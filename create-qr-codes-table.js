// 在Supabase中创建qr_codes表
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createQRCodesTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n🔧 开始创建qr_codes表...\n');

  const sql = `
    -- 创建二维码配置表
    CREATE TABLE IF NOT EXISTS qr_codes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_qr_codes_is_active ON qr_codes(is_active);
    CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes(created_at);
  `;

  try {
    // 注意：Supabase客户端不支持直接执行DDL，需要使用SQL Editor或REST API
    console.log('⚠️ 注意：需要在Supabase SQL Editor中执行以下SQL：\n');
    console.log(sql);
    console.log('\n或者使用Supabase Management API...\n');

    // 尝试通过REST API执行
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql })
      }
    );

    if (response.ok) {
      console.log('✅ SQL执行成功！');
    } else {
      const error = await response.text();
      console.log('❌ 通过API执行失败:', error);
      console.log('\n请手动在Supabase控制台执行上面的SQL');
    }

    // 验证表是否创建成功
    console.log('\n🔍 验证表是否存在...');
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ 表还不存在:', error.message);
      console.log('\n请在Supabase控制台手动执行SQL');
    } else {
      console.log('✅ qr_codes表已存在！');
      
      // 插入默认数据
      console.log('\n📝 插入默认二维码配置...');
      const { error: insertError } = await supabase
        .from('qr_codes')
        .insert({
          name: '客服微信',
          url: 'https://via.placeholder.com/200x200?text=WeChat+QR',
          description: '用于用户咨询和购买激活码',
          is_active: true
        });

      if (insertError && insertError.code !== '23505') { // 忽略重复插入错误
        console.log('⚠️ 插入默认数据失败:', insertError.message);
      } else {
        console.log('✅ 默认数据插入成功！');
      }
    }

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }

  console.log('\n✅ 完成！\n');
}

createQRCodesTable().catch(console.error);

