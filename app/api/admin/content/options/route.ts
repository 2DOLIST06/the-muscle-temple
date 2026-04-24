import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';

export async function GET() {
  const [authorsRes, categoriesRes] = await Promise.all([
    fetch(buildApiUrl('/api/authors'), { cache: 'no-store' }),
    fetch(buildApiUrl('/api/categories'), { cache: 'no-store' })
  ]);

  const authorsPayload = await authorsRes.json().catch(() => ({}));
  const categoriesPayload = await categoriesRes.json().catch(() => ({}));

  return NextResponse.json({
    authors: (authorsPayload as { data?: unknown[] })?.data ?? [],
    categories: (categoriesPayload as { data?: unknown[] })?.data ?? []
  });
}
