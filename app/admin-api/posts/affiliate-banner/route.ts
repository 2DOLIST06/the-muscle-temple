import { isSameOriginAdminRequest } from '@/lib/admin/request-origin';
import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';

export async function POST(request: Request) {
  // This endpoint uses the browser's admin session. Never accept a cross-origin write.
  if (!isSameOriginAdminRequest(request)) {
    return NextResponse.json({ message: 'Origine refusée.' }, { status: 403 });
  }
  const auth = await buildUpstreamAuthHeaders();
  if (auth === null) return NextResponse.json({ message: 'Session admin absente.' }, { status: 401 });
  const upstream = await fetch(buildApiUrl('/admin-api/posts/affiliate-banner'), {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(await request.json()), cache: 'no-store'
  });
  return NextResponse.json(await upstream.json().catch(() => ({})), { status: upstream.status });
}
