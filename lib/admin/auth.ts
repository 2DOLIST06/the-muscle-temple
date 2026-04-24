import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'mt_admin_session';

export const getAdminAuthConfig = () => ({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  accessToken: process.env.ADMIN_ACCESS_TOKEN
});

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const { accessToken } = getAdminAuthConfig();

  return Boolean(token && accessToken && token === accessToken);
}
