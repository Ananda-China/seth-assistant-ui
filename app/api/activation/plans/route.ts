import { NextRequest } from 'next/server';
import { ActivationManager } from '../../../../lib/activation';

export async function GET(req: NextRequest) {
  try {
    const result = await ActivationManager.getPlans();
    
    if (result.success) {
      return Response.json(result);
    } else {
      return Response.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('获取套餐错误:', error);
    return Response.json({ success: false, error: '获取套餐失败' }, { status: 500 });
  }
}
