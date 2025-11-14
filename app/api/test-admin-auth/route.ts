import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 测试管理员认证API...');
    
    // 测试新的requireAdminAuth函数
    const authResult = requireAdminAuth(req);
    
    if ('error' in authResult) {
      console.log('❌ 认证失败，返回错误响应');
      return authResult.error;
    }
    
    const adminUser = authResult.user;
    console.log('✅ 认证成功，管理员:', adminUser.username);
    
    return NextResponse.json({
      success: true,
      message: '管理员认证测试成功',
      adminUser: {
        username: adminUser.username,
        role: adminUser.role
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('测试API错误:', error);
    return NextResponse.json({
      success: false,
      message: '测试API错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
