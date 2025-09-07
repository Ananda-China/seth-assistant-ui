import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';

export interface AdminUser {
  username: string;
  role: string;
  exp: number;
}

// 验证管理员 token
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    
    // 检查是否过期
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// 从请求中获取管理员信息
export function getAdminUser(req: NextRequest): AdminUser | null {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return null;
  
  return verifyAdminToken(token);
}

// 检查管理员权限的中间件
export function requireAdminAuth(req: NextRequest): NextResponse | null {
  const adminUser = getAdminUser(req);
  
  if (!adminUser) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  
  return null; // 继续处理请求
}

// 登出函数
export function clearAdminAuth(): void {
  // 清除 cookie 的逻辑在 API 路由中处理
}
