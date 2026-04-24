import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { buildApiUrl } from '@/lib/api/env';

const SESSION_MAX_AGE = 60 * 60 * 12;

const withSessionCookie = (token: string) => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });

  return response;
};

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
  }

  const staticEmail = process.env.ADMIN_EMAIL;
  const staticPassword = process.env.ADMIN_PASSWORD;
  const staticToken = process.env.ADMIN_ACCESS_TOKEN;

  if (staticEmail && staticPassword && staticToken && body.email === staticEmail && body.password === staticPassword) {
    return withSessionCookie(staticToken);
  }

  const upstream = await fetch(buildApiUrl('/admin-api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password })
  });

  const payload = (await upstream.json().catch(() => ({}))) as {
    data?: { token?: string };
    token?: string;
    message?: string;
    error?: string;
  };

  const token = payload.data?.token ?? payload.token;

  if (!upstream.ok || !token) {
    return NextResponse.json({ error: payload.message ?? payload.error ?? 'Identifiants invalides.' }, { status: 401 });
  }

  return withSessionCookie(token);
}
