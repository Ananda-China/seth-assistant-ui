const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function addQRCodeType() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n🔧 开始添加二维码类型字段...\n');

  try {
    // 1. 添加 type 字段
    console.log('1️⃣ 添加 type 字段到 qr_codes 表...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- 添加 type 字段
        ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'customer';
        
        -- 添加类型检查约束
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'qr_codes_type_check'
          ) THEN
            ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_type_check 
              CHECK (type IN ('customer', 'payment'));
          END IF;
        END $$;
        
        -- 更新现有数据
        UPDATE qr_codes SET type = 'customer' WHERE type IS NULL;
        
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON qr_codes(type);
      `
    });

    if (alterError) {
      console.log('⚠️ 使用 RPC 失败，尝试直接查询...');
      console.log('错误:', alterError.message);
      
      // 如果 RPC 不可用，尝试直接操作
      console.log('\n📝 请在 Supabase SQL Editor 中手动执行以下 SQL:\n');
      console.log(`
-- 添加二维码类型字段
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'customer';

-- 添加类型检查约束
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'qr_codes_type_check'
  ) THEN
    ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_type_check 
      CHECK (type IN ('customer', 'payment'));
  END IF;
END $$;

-- 更新现有数据
UPDATE qr_codes SET type = 'customer' WHERE type IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON qr_codes(type);
      `);
    } else {
      console.log('✅ type 字段添加成功！');
    }

    // 2. 验证字段是否添加成功
    console.log('\n2️⃣ 验证字段是否存在...');
    const { data: qrCodes, error: selectError } = await supabase
      .from('qr_codes')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ 查询失败:', selectError.message);
    } else {
      console.log('✅ qr_codes 表结构:');
      if (qrCodes && qrCodes.length > 0) {
        console.log('   字段:', Object.keys(qrCodes[0]).join(', '));
        if ('type' in qrCodes[0]) {
          console.log('   ✅ type 字段已存在！');
        } else {
          console.log('   ⚠️ type 字段不存在，请手动执行 SQL');
        }
      } else {
        console.log('   表为空，无法验证字段');
      }
    }

    console.log('\n✅ 完成！\n');
    console.log('📝 现在可以在后台管理中添加收款二维码了');
    console.log('   - 客服二维码: type = "customer"');
    console.log('   - 收款二维码: type = "payment"\n');

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

addQRCodeType();

