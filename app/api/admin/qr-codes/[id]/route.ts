import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../../lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { name, url, description, is_active } = await req.json();
    const { id } = params;

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
      .update({
        name,
        url,
        description: description || null,
        is_active: is_active !== false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新二维码配置失败:', error);
      return Response.json({ success: false, message: '更新二维码配置失败' }, { status: 500 });
    }

    if (!data) {
      return Response.json({ success: false, message: '二维码配置不存在' }, { status: 404 });
    }

    return Response.json({
      success: true,
      qrCode: data
    });
  } catch (error) {
    console.error('更新二维码配置错误:', error);
    return Response.json({ success: false, message: '更新二维码配置失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { id } = params;

    const { error } = await supabaseAdmin
      .from('qr_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除二维码配置失败:', error);
      return Response.json({ success: false, message: '删除二维码配置失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除二维码配置错误:', error);
    return Response.json({ success: false, message: '删除二维码配置失败' }, { status: 500 });
  }
}
