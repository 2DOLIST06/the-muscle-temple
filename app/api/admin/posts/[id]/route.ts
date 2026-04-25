import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { buildApiUrl } from '@/lib/api/env';
import { resolveUpstreamAdminToken } from '@/lib/admin/upstream-token';

const unauthorized = () => NextResponse.json({ message: 'Session admin requise.' }, { status: 401 });
const expiredSession = () => NextResponse.json({ message: 'Session expirée. Merci de vous reconnecter.' }, { status: 401 });

async function getAdminToken() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? process.env.ADMIN_ACCESS_TOKEN ?? '';
  if (!sessionToken) return null;
  return resolveUpstreamAdminToken(sessionToken);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAdminToken();
  if (!token) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const upstream = await fetch(buildApiUrl(`/admin-api/posts/${id}`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const payload = await upstream.json().catch(() => ({}));

  if (upstream.status === 401) {
    return expiredSession();
  }

  return NextResponse.json(payload, { status: upstream.status });
}
