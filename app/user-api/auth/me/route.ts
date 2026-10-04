import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { getUserJwt, USER_AUTH_COOKIE } from '@/lib/user/auth';

export async function GET() {
  const token = await getUserJwt();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const upstream = await fetch(buildApiUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const payload = await upstream.json().catch(() => ({}));
  const response = NextResponse.json(payload, { status: upstream.status });
  if (upstream.status === 401) response.cookies.delete(USER_AUTH_COOKIE);
  return response;
}
