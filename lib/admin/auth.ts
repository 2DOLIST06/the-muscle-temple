import { cookies } from 'next/headers';
import { buildApiUrl } from '@/lib/api/env';

export const ADMIN_COOKIE_NAME = 'mt_admin_session';

async function isBackendTokenValid(token: string) {
  const response = await fetch(buildApiUrl('/admin-api/me'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return response.ok;
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const expectedStaticToken = process.env.ADMIN_ACCESS_TOKEN;

  if (!token) return false;

  if (expectedStaticToken) {
    return token === expectedStaticToken;
  }

  return isBackendTokenValid(token);
}
