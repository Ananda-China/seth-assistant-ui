import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export type AuthedUser = { phone: string };

export function requireUser(req: NextRequest): AuthedUser | null {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';
    const decoded = jwt.verify(token, secret) as any;
    if (!decoded || typeof decoded.phone !== 'string') return null;
    return { phone: decoded.phone };
  } catch {
    return null;
  }
}


