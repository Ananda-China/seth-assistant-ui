// 通过Supabase Management API执行SQL
require('dotenv').config({ path: '.env.local' });

async function executeSQLViaManagementAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // 从URL中提取项目引用ID
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('❌ 无法从URL中提取项目ID');
    return;
  }

  console.log('📋 项目ID:', projectRef);
  console.log('🔧 准备执行SQL...\n');

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

-- 插入默认数据
INSERT INTO qr_codes (name, url, description, is_active) 
VALUES ('客服微信', 'https://via.placeholder.com/200x200?text=WeChat+QR', '用于用户咨询和购买激活码', true)
ON CONFLICT DO NOTHING;
`;

  console.log('SQL内容：');
  console.log(sql);
  console.log('\n---\n');

  // 尝试通过PostgREST执行（使用原始SQL）
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    console.log('响应状态:', response.status);
    const text = await response.text();
    console.log('响应内容:', text);

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  }

  console.log('\n\n===========================================');
  console.log('⚠️ 如果上述方法失败，请手动执行以下步骤：');
  console.log('===========================================\n');
  console.log('1. 访问 https://supabase.com/dashboard/project/' + projectRef);
  console.log('2. 点击左侧菜单 "SQL Editor"');
  console.log('3. 点击 "New query"');
  console.log('4. 粘贴以下SQL并点击 "Run"：\n');
  console.log(sql);
  console.log('\n===========================================\n');
}

executeSQLViaManagementAPI().catch(console.error);

