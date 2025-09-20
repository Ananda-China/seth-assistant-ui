import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../../lib/supabase';

// JWT 密钥（生产环境应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    console.log('管理员登录请求:', {
      username,
      hasPassword: !!password
    });

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请提供用户名和密码' },
        { status: 400 }
      );
    }

    // 从数据库获取管理员信息
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('username, password_hash')
      .eq('username', username)
      .single();

    if (error || !admin) {
      console.log('管理员账户不存在:', username);
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      console.log('管理员密码验证失败:', username);
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    console.log('管理员登录验证成功，生成JWT token');

    // 生成 JWT token
    const payload = {
      username: admin.username,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
    };

    const token = jwt.sign(payload, JWT_SECRET);

    // 设置 HTTP-only cookie
    const response = NextResponse.json({ 
      success: true, 
      message: '登录成功',
      user: {
        username: admin.username,
        role: 'admin'
      }
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
