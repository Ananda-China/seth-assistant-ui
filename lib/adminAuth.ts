import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';

// 调试信息
console.log('AdminAuth初始化:', {
  hasJwtSecret: !!process.env.JWT_SECRET,
  jwtSecretLength: JWT_SECRET.length,
  nodeEnv: process.env.NODE_ENV
});

export interface AdminUser {
  username: string;
  role: string;
  exp: number;
}

// 验证管理员 token
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    console.log('验证Token:', {
      tokenLength: token.length,
      jwtSecretLength: JWT_SECRET.length,
      hasJwtSecret: !!JWT_SECRET
    });

    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    console.log('Token解码成功:', { username: decoded.username, role: decoded.role });

    // 检查是否过期
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.log('Token已过期');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', {
      error: error instanceof Error ? error.message : error,
      tokenPreview: token.substring(0, 20) + '...',
      jwtSecretPreview: JWT_SECRET.substring(0, 10) + '...'
    });
    return null;
  }
}

// 从请求中获取管理员信息
export function getAdminUser(req: NextRequest): AdminUser | null {
  const token = req.cookies.get('admin_token')?.value;
  console.log('获取管理员用户:', {
    hasToken: !!token,
    cookieCount: req.cookies.getAll().length,
    allCookies: req.cookies.getAll().map(c => c.name)
  });

  if (!token) {
    console.log('未找到admin_token cookie');
    return null;
  }

  return verifyAdminToken(token);
}

// 检查管理员权限，返回管理员用户信息或null
export function requireAdminAuth(req: NextRequest): AdminUser | null {
  const adminUser = getAdminUser(req);
  return adminUser;
}

// 登出函数
export function clearAdminAuth(): void {
  // 清除 cookie 的逻辑在 API 路由中处理
}
