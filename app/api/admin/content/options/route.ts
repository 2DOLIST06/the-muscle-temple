import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { buildApiUrl } from '@/lib/api/env';
import { resolveUpstreamAdminToken } from '@/lib/admin/upstream-token';

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? process.env.ADMIN_ACCESS_TOKEN ?? '';
  const token = sessionToken ? await resolveUpstreamAdminToken(sessionToken) : null;

  if (!token) {
    return NextResponse.json({ message: 'Session admin requise.' }, { status: 401 });
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

  if ([authorsRes, categoriesRes, tagsRes, mediaRes, postsRes].some((response) => response.status === 401)) {
    return NextResponse.json({ message: 'Session expirée. Merci de vous reconnecter.' }, { status: 401 });
  }

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
