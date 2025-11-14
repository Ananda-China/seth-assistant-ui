import { NextRequest } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { getStoreModule } from '../../../../lib/config';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireUser(req);
  if (!user) return new Response('unauthorized', { status: 401 });
  const { title } = await req.json().catch(() => ({ title: '' }));
  const storeModule = await getStoreModule();
  const ok = await storeModule.renameConversation(user.phone, params.id, String(title || ''));
  return Response.json({ success: ok });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireUser(req);
  if (!user) return new Response('unauthorized', { status: 401 });
  const storeModule = await getStoreModule();
  await storeModule.deleteConversation(user.phone, params.id);
  return Response.json({ success: true });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireUser(req);
  if (!user) return new Response('unauthorized', { status: 401 });

  console.log('🔍 [API] 获取消息列表:', {
    conversationId: params.id,
    userPhone: user.phone
  });

  const storeModule = await getStoreModule();

  try {
    const list = await storeModule.listMessages(user.phone, params.id);
    console.log('✅ [API] 成功获取消息:', {
      count: list.length,
      sample: list.slice(0, 3).map((m: any) => ({ role: m.role, contentLength: m.content?.length }))
    });
    return Response.json({ list });
  } catch (error) {
    console.error('❌ [API] 获取消息失败:', error);
    return Response.json({ list: [], error: error instanceof Error ? error.message : 'Unknown error' });
  }
}


