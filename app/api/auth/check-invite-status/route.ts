import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json().catch(() => ({}));
    
    if (!phone) {
      return NextResponse.json({ 
        success: false, 
        message: '请提供手机号' 
      }, { status: 400 });
    }

    // 检查用户是否存在以及是否已有邀请关系
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('phone, invited_by')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的（新用户）
      console.error('检查用户邀请状态失败:', error);
      return NextResponse.json({ 
        success: false, 
        message: '检查失败' 
      }, { status: 500 });
    }

    // 如果用户不存在，可以填写邀请码（新用户）
    if (!user) {
      return NextResponse.json({
        success: true,
        canSetInvite: true,
        message: '新用户，可以填写邀请码'
      });
    }

    // 如果用户已存在（不管有没有邀请关系），都不能再填写邀请码
    return NextResponse.json({
      success: true,
      canSetInvite: false,
      invitedBy: user.invited_by || null,
      message: user.invited_by
        ? `该手机号已被 ${user.invited_by} 邀请，无法修改邀请关系`
        : '该手机号已注册，无法填写邀请码'
    });

  } catch (error) {
    console.error('检查邀请状态错误:', error);
    return NextResponse.json({ 
      success: false, 
      message: '检查失败' 
    }, { status: 500 });
  }
}
