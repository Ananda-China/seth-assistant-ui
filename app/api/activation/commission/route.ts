import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { ActivationManager } from '../../../../lib/activation';
import { supabaseAdmin } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';
    const decoded = jwt.verify(token, secret) as any;
    const phone = decoded?.phone as string;
    
    if (!phone) {
      return Response.json({ success: false, message: '未登录' }, { status: 401 });
    }

    // 获取用户ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return Response.json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    // 获取用户佣金记录
    const result = await ActivationManager.getUserCommissionRecords(user.id);
    
    if (result.success) {
      return Response.json({
        success: true,
        records: result.records
      });
    } else {
      return Response.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('获取佣金记录错误:', error);
    return Response.json({ success: false, message: '获取佣金记录失败' }, { status: 500 });
  }
}
