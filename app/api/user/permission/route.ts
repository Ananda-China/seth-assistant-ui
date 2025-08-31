import { NextRequest } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { getUsers } from '../../../../lib/config';

export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  if (!auth) {
    return new Response('unauthorized', { status: 401 });
  }

  try {
    const usersModule = await getUsers();
    const permission = await usersModule.getUserPermission(auth.phone);

    return new Response(JSON.stringify({
      success: true,
      data: permission
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting user permission:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get user permission'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
