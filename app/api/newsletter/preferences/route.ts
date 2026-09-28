import { NextResponse } from 'next/server';
import { buildPublicApiUrl } from '@/lib/api/env';

const proxy = async (request: Request, method: 'GET' | 'PUT') => {
  const requestUrl = new URL(request.url);
  let token = requestUrl.searchParams.get('token')?.trim();
  let body: Record<string, unknown> | undefined;

  if (method === 'PUT') {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    token = typeof body.token === 'string' ? body.token.trim() : token;
  }
  if (!token) return NextResponse.json({ message: 'Token manquant.' }, { status: 400 });

  const target = new URL(buildPublicApiUrl('/api/newsletter/preferences'));
  target.searchParams.set('token', token);
  try {
    const response = await fetch(target, {
      method,
      headers: method === 'PUT' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'PUT' ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({ message: 'Réponse newsletter invalide.' }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Service newsletter temporairement indisponible.' }, { status: 502 });
  }
};

export const GET = (request: Request) => proxy(request, 'GET');
export const PUT = (request: Request) => proxy(request, 'PUT');
