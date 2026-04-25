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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAdminToken();
  if (!token) return missingToken();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const upstream = await fetch(buildApiUrl(`/admin-api/posts/${id}`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const payload = await upstream.json().catch(() => ({}));

  return NextResponse.json(payload, { status: upstream.status });
}
