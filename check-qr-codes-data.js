// 检查二维码数据
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xtqvpqxqxzhfhqxqxqxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cXZwcXhxeHpoZmhxeHFxeHFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI4MjE5MSwiZXhwIjoyMDQ5ODU4MTkxfQ.cici';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQRCodes() {
  console.log('📋 检查二维码数据...\n');
  
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }

  console.log(`找到 ${data.length} 条二维码记录:\n`);
  
  data.forEach((qr, index) => {
    console.log(`--- 记录 ${index + 1} ---`);
    console.log('ID:', qr.id);
    console.log('名称:', qr.name);
    console.log('描述:', qr.description || '(无)');
    console.log('状态:', qr.is_active ? '✅ 启用' : '❌ 禁用');
    console.log('创建时间:', qr.created_at);
    console.log('URL类型:', qr.url.startsWith('data:image/') ? 'Base64图片' : qr.url.startsWith('http') ? 'HTTP链接' : '未知格式');
    console.log('URL长度:', qr.url.length);
    console.log('URL前100字符:', qr.url.substring(0, 100));
    console.log('');
  });
}

checkQRCodes();

