import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === '/admin/login';
  const hasSession = Boolean(request.cookies.get(ADMIN_COOKIE_NAME)?.value);

  if (!isLoginPage && !hasSession) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && hasSession) {
    const postsUrl = new URL('/admin/posts', request.url);
    return NextResponse.redirect(postsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
