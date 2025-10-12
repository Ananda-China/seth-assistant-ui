import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { data: qrCodes, error } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取二维码配置失败:', error);
      return Response.json({ success: false, message: '获取二维码配置失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      qrCodes: qrCodes || []
    });
  } catch (error) {
    console.error('获取二维码配置错误:', error);
    return Response.json({ success: false, message: '获取二维码配置失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { name, url, description, is_active } = await req.json();

    if (!name || !url) {
      return Response.json({ success: false, message: '名称和URL不能为空' }, { status: 400 });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return Response.json({ success: false, message: 'URL格式不正确' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('qr_codes')
      .insert({
        name,
        url,
        description: description || null,
        is_active: is_active !== false
      })
      .select()
      .single();

    if (error) {
      console.error('创建二维码配置失败:', error);
      return Response.json({ success: false, message: '创建二维码配置失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      qrCode: data
    });
  } catch (error) {
    console.error('创建二维码配置错误:', error);
    return Response.json({ success: false, message: '创建二维码配置失败' }, { status: 500 });
  }
}
