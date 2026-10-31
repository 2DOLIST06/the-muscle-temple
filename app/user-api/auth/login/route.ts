import { isSameOriginAdminRequest } from '@/lib/admin/request-origin';
import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { USER_AUTH_COOKIE, userCookieOptions } from '@/lib/user/auth';

export async function POST(request: Request) {
  if (!request.headers.get('origin') || !isSameOriginAdminRequest(request)) return NextResponse.json({error:'Forbidden'},{status:403});
  const body = await request.json().catch(() => ({}));
  const upstream = await fetch(buildApiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  const payload = await upstream.json().catch(() => ({})) as { data?: { token?: string; accessToken?: string; user?: unknown }; token?: string; accessToken?: string; user?: unknown };
  const token = payload.data?.token ?? payload.data?.accessToken ?? payload.token ?? payload.accessToken;
  if (!upstream.ok || !token) return NextResponse.json(payload, { status: upstream.status || 401 });
  const response = NextResponse.json(payload.data?.user ?? payload.user ?? { ok: true });
  response.cookies.set(USER_AUTH_COOKIE, token, userCookieOptions());
  return response;
}
