import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: '测试API工作正常',
    timestamp: new Date().toISOString()
  });
}
