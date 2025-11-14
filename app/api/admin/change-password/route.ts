import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { currentPassword, newPassword } = await req.json();

    // 验证输入
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: '请提供当前密码和新密码' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: '新密码长度不能少于8位' },
        { status: 400 }
      );
    }

    const adminUser = authResult.user;

    // 获取当前管理员信息
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('password_hash')
      .eq('username', adminUser.username)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json(
        { success: false, message: '管理员账户不存在' },
        { status: 404 }
      );
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: '当前密码错误' },
        { status: 400 }
      );
    }

    // 生成新密码哈希
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ password_hash: newPasswordHash })
      .eq('username', adminUser.username);

    if (updateError) {
      console.error('更新管理员密码失败:', updateError);
      return NextResponse.json(
        { success: false, message: '密码更新失败' },
        { status: 500 }
      );
    }

    console.log(`✅ 管理员 ${adminUser.username} 密码更新成功`);

    return NextResponse.json({
      success: true,
      message: '密码更新成功'
    });

  } catch (error) {
    console.error('修改管理员密码错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
