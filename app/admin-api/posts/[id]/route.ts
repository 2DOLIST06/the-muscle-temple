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

async function passthrough(request: Request, id: string, method: 'GET' | 'PUT' | 'DELETE') {
  const token = await getAdminToken();
  if (!token) return missingToken();

  const upstream = await fetch(buildApiUrl(`/admin-api/posts/${id}`), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {})
    },
    body: method === 'PUT' ? JSON.stringify(await request.json().catch(() => ({}))) : undefined
  });

  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return passthrough(request, id, 'GET');
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return passthrough(request, id, 'PUT');
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return passthrough(request, id, 'DELETE');
}
