import { NextRequest } from 'next/server';
import { ActivationManager } from '../../../../lib/activation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
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
