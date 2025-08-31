import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// 管理员账号配置（生产环境应该存储在数据库中）
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123', // 生产环境请使用强密码
  role: 'admin'
};

// JWT 密钥（生产环境应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // 验证用户名和密码
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // 生成 JWT token
      const token = jwt.sign(
        { 
          username: ADMIN_CREDENTIALS.username, 
          role: ADMIN_CREDENTIALS.role,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        },
        JWT_SECRET
      );

      // 设置 HTTP-only cookie
      const response = NextResponse.json({ 
        success: true, 
        message: '登录成功',
        user: {
          username: ADMIN_CREDENTIALS.username,
          role: ADMIN_CREDENTIALS.role
        }
      });

      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 // 24小时
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
