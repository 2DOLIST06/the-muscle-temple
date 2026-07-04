import { NextResponse, type NextRequest } from 'next/server';
import { getPathLocale } from '@/lib/i18n/routing';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase();
  const protocol = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');

  if ((host === 'bodytrainingguide.com' || host === 'www.bodytrainingguide.com') && (host !== 'www.bodytrainingguide.com' || protocol !== 'https')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = 'www.bodytrainingguide.com';
    return NextResponse.redirect(url, 301);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-body-training-guide-locale', getPathLocale(request.nextUrl.pathname));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|admin-api|_next/static|_next/image|favicon.ico).*)']
};
