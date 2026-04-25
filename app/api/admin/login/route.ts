import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE } from '@/lib/admin/auth';
import { buildApiUrl } from '@/lib/api/env';
import { extractApiMessage, extractToken } from '@/lib/admin/api-contract';

const withSessionCookie = (token: string) => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE
  });

  return response;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };

  const normalizedEmail = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!normalizedEmail || !password) {
    return NextResponse.json({ message: 'Email et mot de passe requis.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(buildApiUrl('/admin-api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password })
    });
  } catch {
    return NextResponse.json({ message: 'Service d’authentification indisponible. Réessayez plus tard.' }, { status: 503 });
  }

  const payload = (await upstream.json().catch(() => ({}))) as unknown;
  const token = extractToken(payload);

  if (!upstream.ok) {
    const status = upstream.status === 400 || upstream.status === 401 ? upstream.status : 502;
    return NextResponse.json({ message: extractApiMessage(payload, `Authentication failed (${upstream.status}).`) }, { status });
  }

  if (!token) {
    return NextResponse.json({ message: 'Réponse backend invalide: token manquant.' }, { status: 502 });
  }

  return withSessionCookie(token);
}
