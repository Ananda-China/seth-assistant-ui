const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('🔎 检查 qr_codes 表...');
  const { data, error } = await supabase.from('qr_codes').select('*').limit(5);
  if (error) {
    console.error('❌ 查询失败:', error);
  } else {
    console.log('✅ 查询成功, 前5条记录:', data);
  }
})();

