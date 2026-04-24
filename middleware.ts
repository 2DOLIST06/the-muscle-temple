import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';

const looksLikeJwt = (token: string) => token.split('.').length === 3;
const STATIC_ADMIN_LOGIN_ENABLED = process.env.ENABLE_STATIC_ADMIN_LOGIN === 'true';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const expectedStaticToken = process.env.ADMIN_ACCESS_TOKEN;

  const staticAuthenticated =
    STATIC_ADMIN_LOGIN_ENABLED && expectedStaticToken ? token === expectedStaticToken : false;
  const jwtAuthenticated = token ? looksLikeJwt(token) : false;
  const authenticated = staticAuthenticated || jwtAuthenticated;

  if (!authenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
