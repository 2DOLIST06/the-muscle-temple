import { NextResponse } from 'next/server';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';
import { getIndexNowPages, submitIndexNowUrls } from '@/lib/seo/indexnow';

const missingSession = () => NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

export async function GET() {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();

  const pages = await getIndexNowPages();
  return NextResponse.json({ data: pages });
}

export async function POST(request: Request) {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();

  const body = (await request.json().catch(() => ({}))) as { urls?: unknown; onlyNeeded?: unknown };
  const pages = await getIndexNowPages();
  const urls = body.onlyNeeded
    ? pages.filter((page) => page.needsSubmission).map((page) => page.url)
    : Array.isArray(body.urls)
      ? body.urls.filter((url): url is string => typeof url === 'string')
      : [];

  try {
    const result = await submitIndexNowUrls(urls);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Envoi IndexNow impossible.' }, { status: 400 });
  }
}
