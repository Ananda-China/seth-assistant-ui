import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return Response.json({ 
    success: true, 
    message: '测试API工作正常',
    timestamp: new Date().toISOString()
  });
}
