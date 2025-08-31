require('dotenv').config({ path: '.env.local' });

async function debugModuleStructure() {
  console.log('🔍 调试模块结构...\n');

  try {
    // 测试动态导入
    const { getStoreModule } = require('./lib/config.js');
    
    console.log('📋 测试getStoreModule...');
    const storeModule = await getStoreModule();
    
    console.log('📦 storeModule类型:', typeof storeModule);
    console.log('📦 storeModule结构:', Object.keys(storeModule));
    
    if (storeModule.default) {
      console.log('📦 storeModule.default类型:', typeof storeModule.default);
      console.log('📦 storeModule.default结构:', Object.keys(storeModule.default));
    }
    
    // 检查是否有我们需要的函数
    const requiredFunctions = [
      'listConversations',
      'createConversation', 
      'deleteConversation',
      'listMessages',
      'addMessage'
    ];
    
    console.log('\n🔍 检查必需函数:');
    requiredFunctions.forEach(func => {
      if (storeModule[func]) {
        console.log(`✅ ${func}: 直接可用`);
      } else if (storeModule.default && storeModule.default[func]) {
        console.log(`✅ ${func}: 在default中可用`);
      } else {
        console.log(`❌ ${func}: 不可用`);
      }
    });
    
    // 尝试调用一个函数
    console.log('\n🧪 尝试调用listConversations...');
    try {
      if (storeModule.listConversations) {
        console.log('✅ 直接调用成功');
      } else if (storeModule.default && storeModule.default.listConversations) {
        console.log('✅ 通过default调用成功');
      } else {
        console.log('❌ 无法调用');
      }
    } catch (error) {
      console.error('❌ 调用失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugModuleStructure();
