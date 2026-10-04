import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { getUserJwt, USER_AUTH_COOKIE } from '@/lib/user/auth';

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const token = await getUserJwt();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const upstream = await fetch(`${buildApiUrl(`/api/nutrition/${path.map(encodeURIComponent).join('/')}`)}${incoming.search}`, {
    method: request.method,
    headers: { Authorization: `Bearer ${token}`, ...(request.method === 'GET' || request.method === 'DELETE' ? {} : { 'Content-Type': 'application/json' }) },
    body: request.method === 'GET' || request.method === 'DELETE' ? undefined : await request.text(),
    cache: 'no-store'
  });
  const payload = await upstream.json().catch(() => ({}));
  const response = NextResponse.json(payload, { status: upstream.status });
  if (upstream.status === 401) response.cookies.delete(USER_AUTH_COOKIE);
  return response;
}
export const GET = proxy; export const POST = proxy; export const PUT = proxy; export const PATCH = proxy; export const DELETE = proxy;
