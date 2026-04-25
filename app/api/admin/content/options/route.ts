import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { resolveUpstreamAdminToken } from '@/lib/admin/upstream-token';

export async function GET() {
  const staticToken = process.env.ADMIN_ACCESS_TOKEN ?? '';
  const token = staticToken ? await resolveUpstreamAdminToken(staticToken) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'ADMIN_ACCESS_TOKEN manquant. Configurez ce token côté serveur pour activer les routes admin.' },
      { status: 503 }
    );
  }

  const [authorsRes, categoriesRes, tagsRes, mediaRes, postsRes] = await Promise.all([
    fetch(buildApiUrl('/admin-api/authors'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }),
    fetch(buildApiUrl('/admin-api/categories'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }),
    fetch(buildApiUrl('/admin-api/tags'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }),
    fetch(buildApiUrl('/admin-api/media'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }),
    fetch(buildApiUrl('/admin-api/posts'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    })
  ]);

  const authorsPayload = (await authorsRes.json().catch(() => ({}))) as { data?: unknown[] };
  const categoriesPayload = (await categoriesRes.json().catch(() => ({}))) as { data?: unknown[] };
  const tagsPayload = (await tagsRes.json().catch(() => ({}))) as { data?: unknown[] };
  const mediaPayload = (await mediaRes.json().catch(() => ({}))) as { data?: unknown[] };
  const postsPayload = (await postsRes.json().catch(() => ({}))) as { data?: unknown[] };

  return NextResponse.json({
    authors: authorsPayload.data ?? [],
    categories: categoriesPayload.data ?? [],
    tags: tagsPayload.data ?? [],
    media: mediaPayload.data ?? [],
    posts: postsPayload.data ?? []
  });
}
