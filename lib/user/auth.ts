import { cookies } from 'next/headers';

export const USER_AUTH_COOKIE = 'user_jwt';

export async function getUserJwt() {
  return (await cookies()).get(USER_AUTH_COOKIE)?.value ?? null;
}

export const userCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 12
});
