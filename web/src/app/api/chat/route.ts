import { NextRequest } from 'next/server';

const DIFY_API_URL = process.env.DIFY_API_URL || '';
const DIFY_API_KEY = process.env.DIFY_API_KEY || '';

export async function POST(req: NextRequest) {
  if (!DIFY_API_URL || !DIFY_API_KEY) {
    return new Response('Missing Dify config', { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const query: string = String(body?.query || '').trim();
  const conversationId: string | undefined = body?.conversation_id || undefined;

  if (!query) {
    return new Response('empty query', { status: 400 });
  }

  const apiUrl = `${DIFY_API_URL.replace(/\/$/, '')}/chat-messages`; // e.g. https://api.dify.ai/v1

  const difyRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'streaming',
      user: 'anonymous',
      conversation_id: conversationId,
    }),
  });

  if (!difyRes.ok || !difyRes.body) {
    const text = await difyRes.text().catch(() => '');
    return new Response(text || 'dify request failed', { status: 500 });
  }

  const reader = difyRes.body.getReader();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // try to forward conversation id from the first event if present
      let firstEventSent = false;
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          // Dify streaming uses SSE: lines start with 'data: {...}'
          const dataPrefix = 'data: ';
          if (!line.startsWith(dataPrefix)) continue;
          const jsonStr = line.slice(dataPrefix.length);
          try {
            const evt = JSON.parse(jsonStr);
            if (!firstEventSent && evt?.conversation_id) {
              firstEventSent = true;
              controller.enqueue(encoder.encode(`CID:${evt.conversation_id}`));
            }
            const content = evt?.answer || evt?.data || '';
            if (content) controller.enqueue(encoder.encode(String(content)));
          } catch {
            // forward raw text if not JSON
            controller.enqueue(encoder.encode(line));
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}


