import { NextRequest } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { getStoreModule } from '../../../lib/config';

export async function GET(req: NextRequest) {
  const user = requireUser(req);
  if (!user) {
    console.log('❌ [API] 未授权访问对话列表');
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  console.log('🔍 [API] 获取对话列表:', { userPhone: user.phone });
  const storeModule = await getStoreModule();
  const list = await storeModule.listConversations(user.phone);
  console.log('✅ [API] 对话列表查询成功:', {
    userPhone: user.phone,
    count: list.length,
    conversations: list.map((c: any) => ({ id: c.id, title: c.title, is_deleted: c.is_deleted }))
  });

  return Response.json({ list });
}

export async function POST(req: NextRequest) {
  const user = requireUser(req);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const { title } = await req.json().catch(() => ({ title: '新会话' }));
  const storeModule = await getStoreModule();
  const conv = await storeModule.createConversation(user.phone, title || '新会话');
  return Response.json({ conversation: conv });
}


