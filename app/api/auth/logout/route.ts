import { NextRequest } from 'next/server';

function makeClearCookieHeader() {
  return 'sid=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax';
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const redirect = url.searchParams.get('redirect');
  const clearCookie = makeClearCookieHeader();
  if (redirect) {
    const headers = new Headers();
    const target = redirect.startsWith('http') ? redirect : `${url.origin}${redirect}`;
    headers.set('Location', target);
    headers.set('Set-Cookie', clearCookie);
    return new Response(null, { status: 302, headers });
  }
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookie,
    },
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}


