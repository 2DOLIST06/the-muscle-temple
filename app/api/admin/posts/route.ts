import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { resolveUpstreamAdminToken } from '@/lib/admin/upstream-token';

const missingToken = () =>
  NextResponse.json(
    { error: 'ADMIN_ACCESS_TOKEN manquant. Configurez ce token côté serveur pour activer les routes admin.' },
    { status: 503 }
  );

async function getAdminToken() {
  const staticToken = process.env.ADMIN_ACCESS_TOKEN ?? '';
  if (!staticToken) return null;
  return resolveUpstreamAdminToken(staticToken);
}

export async function GET() {
  const token = await getAdminToken();
  if (!token) return missingToken();

  const upstream = await fetch(buildApiUrl('/admin-api/posts'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const payload = await upstream.json().catch(() => ({}));

  return NextResponse.json(payload, { status: upstream.status });
}

export async function POST(request: Request) {
  const token = await getAdminToken();
  if (!token) return missingToken();

  const body = await request.json().catch(() => ({}));

  const upstream = await fetch(buildApiUrl('/admin-api/posts'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const payload = await upstream.json().catch(() => ({}));

  return NextResponse.json(payload, { status: upstream.status });
}
