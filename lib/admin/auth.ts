import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'mt_admin_session';

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const expectedStaticToken = process.env.ADMIN_ACCESS_TOKEN;

  if (!token) return false;
  if (expectedStaticToken) return token === expectedStaticToken;
  return true;
}
