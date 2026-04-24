import { buildApiUrl } from '@/lib/api/env';

const looksLikeJwt = (token: string) => token.split('.').length === 3;

export async function resolveUpstreamAdminToken(sessionToken: string) {
  if (looksLikeJwt(sessionToken)) {
    return sessionToken;
  }

  const staticToken = process.env.ADMIN_ACCESS_TOKEN;
  const staticEmail = process.env.ADMIN_EMAIL;
  const staticPassword = process.env.ADMIN_PASSWORD;

  if (!staticToken || !staticEmail || !staticPassword || sessionToken !== staticToken) {
    return null;
  }

  const loginRes = await fetch(buildApiUrl('/admin-api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staticEmail, password: staticPassword }),
    cache: 'no-store'
  });

  const payload = (await loginRes.json().catch(() => ({}))) as {
    data?: { token?: string };
    token?: string;
  };

  const token = payload.data?.token ?? payload.token;
  return loginRes.ok && token ? token : null;
}
