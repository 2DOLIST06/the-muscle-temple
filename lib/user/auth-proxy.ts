import { isSameOriginAdminRequest } from '@/lib/admin/request-origin';
import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { getUserJwt, USER_AUTH_COOKIE, userCookieOptions } from './auth';

export async function authProxy(request: Request, path: string, authenticated = false, session = false, exposeSessionResult = false) {
  if (!request.headers.get('origin') || !isSameOriginAdminRequest(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const token = authenticated ? await getUserJwt() : null;
  if (authenticated && !token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const upstream = await fetch(buildApiUrl(path), {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: await request.text(), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000)
    });
    const payload = await upstream.json().catch(() => ({}));
    const safePayload = { ...payload }; delete safePayload.token;
    const response = NextResponse.json(session && upstream.ok ? (exposeSessionResult ? safePayload : { ok: true }) : payload, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
    if (session && upstream.ok && payload.token) response.cookies.set(USER_AUTH_COOKIE, payload.token, userCookieOptions());
    if (authenticated && upstream.status === 401) response.cookies.delete(USER_AUTH_COOKIE);
    return response;
  } catch { return NextResponse.json({ error: 'Service unavailable' }, { status: 503 }); }
}
