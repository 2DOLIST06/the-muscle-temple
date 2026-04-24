import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { buildApiUrl } from '@/lib/api/env';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: 'Session admin requise.' }, { status: 401 });
  }

  const [authorsRes, categoriesRes] = await Promise.all([
    fetch(buildApiUrl('/admin-api/authors'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }),
    fetch(buildApiUrl('/admin-api/categories'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    })
  ]);

  if (authorsRes.status === 401 || categoriesRes.status === 401) {
    return NextResponse.json({ error: 'Session expirée. Merci de vous reconnecter.' }, { status: 401 });
  }

  const authorsPayload = (await authorsRes.json().catch(() => ({}))) as { data?: unknown[] };
  const categoriesPayload = (await categoriesRes.json().catch(() => ({}))) as { data?: unknown[] };

  return NextResponse.json({
    authors: authorsPayload.data ?? [],
    categories: categoriesPayload.data ?? []
  });
}
