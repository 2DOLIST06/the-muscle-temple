import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { USER_AUTH_COOKIE, userCookieOptions } from '@/lib/user/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const upstream = await fetch(buildApiUrl('/api/auth/register'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  const payload = await upstream.json().catch(() => ({})) as { data?: { token?: string; accessToken?: string; user?: unknown }; token?: string; accessToken?: string; user?: unknown };
  const token = payload.data?.token ?? payload.data?.accessToken ?? payload.token ?? payload.accessToken;
  if (!upstream.ok || !token) return NextResponse.json(payload, { status: upstream.status || 400 });
  const response = NextResponse.json(payload.data?.user ?? payload.user ?? { ok: true });
  response.cookies.set(USER_AUTH_COOKIE, token, userCookieOptions());
  return response;
}
