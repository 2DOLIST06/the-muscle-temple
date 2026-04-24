import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminAuthConfig } from '@/lib/admin/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };
  const auth = getAdminAuthConfig();

  if (!auth.email || !auth.password || !auth.accessToken) {
    return NextResponse.json(
      { error: 'Configuration admin incomplète. Définis ADMIN_EMAIL, ADMIN_PASSWORD et ADMIN_ACCESS_TOKEN.' },
      { status: 500 }
    );
  }

  if (email !== auth.email || password !== auth.password) {
    return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: auth.accessToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  });

  return response;
}
