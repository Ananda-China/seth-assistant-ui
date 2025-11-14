// 测试 Supabase 配置
console.log('Environment variables:');
console.log('USE_SUPABASE:', process.env.USE_SUPABASE);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

// 测试配置模块
async function testConfig() {
  try {
    const { USE_SUPABASE, getUsers } = await import('./lib/config.js');
    console.log('\nConfig module:');
    console.log('USE_SUPABASE:', USE_SUPABASE);
    
    const usersModule = await getUsers();
    console.log('Users module functions:', Object.keys(usersModule));
    
    if ('getAllUsers' in usersModule) {
      console.log('✅ Using Supabase version');
    } else {
      console.log('❌ Using file system version');
    }
  } catch (error) {
    console.error('Error testing config:', error);
  }
}

testConfig();
