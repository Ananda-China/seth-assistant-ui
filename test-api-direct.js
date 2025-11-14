// 直接测试API
console.log('开始测试激活码API...');

fetch('/api/admin/activation-codes')
  .then(response => {
    console.log('API响应状态:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('API响应数据:', data);
    console.log('激活码数量:', data.codes?.length || 0);
  })
  .catch(error => {
    console.error('API请求失败:', error);
  });
