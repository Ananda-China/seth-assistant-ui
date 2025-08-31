import { NextRequest } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { getStoreModule } from '../../../lib/config';

export async function GET(req: NextRequest) {
  const user = requireUser(req);
  if (!user) return new Response('unauthorized', { status: 401 });
  const storeModule = await getStoreModule();
  const list = await storeModule.listConversations(user.phone);
  return Response.json({ list });
}

export async function POST(req: NextRequest) {
  const user = requireUser(req);
  if (!user) return new Response('unauthorized', { status:401 });
  const { title } = await req.json().catch(() => ({ title: '新会话' }));
  const storeModule = await getStoreModule();
  const conv = await storeModule.createConversation(user.phone, title || '新会话');
  return Response.json({ conversation: conv });
}


