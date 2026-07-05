import { notFound } from 'next/navigation';

import { getConfiguredIndexNowKey } from '@/lib/seo/indexnow';

export async function GET(_request: Request, { params }: { params: Promise<{ indexNowKey: string }> }) {
  const { indexNowKey } = await params;
  const key = getConfiguredIndexNowKey();
  if (!key || indexNowKey !== `${key}.txt`) notFound();

  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
