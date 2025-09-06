import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { ActivationManager } from '../../../../lib/activation';
import { supabaseAdmin } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
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

    // 获取激活码
    const { code } = await req.json().catch(() => ({}));
    if (!code) {
      return Response.json({ success: false, message: '请输入激活码' }, { status: 400 });
    }

    // 激活激活码
    const result = await ActivationManager.activateCode(code, user.id);
    
    if (result.success) {
      return Response.json(result);
    } else {
      return Response.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('激活码激活错误:', error);
    return Response.json({ success: false, message: '激活失败' }, { status: 500 });
  }
}
