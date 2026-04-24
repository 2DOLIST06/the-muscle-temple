import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { buildApiUrl } from '@/lib/api/env';
import { resolveUpstreamAdminToken } from '@/lib/admin/upstream-token';

const unauthorized = () => NextResponse.json({ error: 'Session admin requise.' }, { status: 401 });
const expiredSession = () => NextResponse.json({ error: 'Session expirée. Merci de vous reconnecter.' }, { status: 401 });

async function getUpstreamToken() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  return resolveUpstreamAdminToken(sessionToken);
}

export async function GET() {
  const token = await getUpstreamToken();
  if (!token) return expiredSession();

  const upstream = await fetch(buildApiUrl('/admin-api/posts'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const payload = await upstream.json().catch(() => ({}));

  if (upstream.status === 401) {
    return expiredSession();
  }

  return NextResponse.json(payload, { status: upstream.status });
}

export async function POST(request: Request) {
  const token = await getUpstreamToken();
  if (!token) return unauthorized();

  const body = await request.json().catch(() => ({}));

  const upstream = await fetch(buildApiUrl('/admin-api/posts'), {
    method: 'POST',
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
