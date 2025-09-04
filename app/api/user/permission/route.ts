import { NextRequest } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { getUsers } from '../../../../lib/config';

export async function GET(req: NextRequest) {
  console.log('🔍 /api/user/permission 开始处理请求');
  
  const auth = requireUser(req);
  if (!auth) {
    console.log('❌ /api/user/permission 认证失败');
    return new Response('unauthorized', { status: 401 });
  }

  console.log('✅ /api/user/permission 认证成功，用户手机号:', auth.phone);

  try {
    console.log('🔍 获取用户模块...');
    const usersModule = await getUsers();
    console.log('✅ 用户模块获取成功');
    
    console.log('🔍 获取用户权限...');
    const permission = await usersModule.getUserPermission(auth.phone);
    console.log('✅ 用户权限获取成功:', permission);

    return new Response(JSON.stringify({
      success: true,
      data: permission
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ /api/user/permission 错误详情:', error);
    console.error('❌ 错误堆栈:', error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get user permission',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
