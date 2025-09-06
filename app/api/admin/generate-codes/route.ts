import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { ActivationManager } from '../../../../lib/activation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 添加管理员认证
    const adminAuth = requireAdminAuth(req);
    if (!adminAuth) {
      return Response.json({ success: false, message: '需要管理员权限' }, { status: 401 });
    }
    const { plan_id, count } = await req.json().catch(() => ({}));
    
    if (!plan_id || !count) {
      return Response.json({ success: false, message: '参数不完整' }, { status: 400 });
    }

    if (count < 1 || count > 100) {
      return Response.json({ success: false, message: '生成数量必须在1-100之间' }, { status: 400 });
    }

    const result = await ActivationManager.generateActivationCodes(plan_id, count);
    
    if (result.success) {
      return Response.json({
        success: true,
        codes: result.codes
      });
    } else {
      return Response.json({ success: false, message: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('生成激活码错误:', error);
    return Response.json({ success: false, message: '生成激活码失败' }, { status: 500 });
  }
}
