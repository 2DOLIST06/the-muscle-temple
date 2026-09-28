import { NextResponse } from 'next/server';
import { buildPublicApiUrl } from '@/lib/api/env';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { token?: unknown };
  if (typeof body.token !== 'string' || !body.token.trim()) {
    return NextResponse.json({ message: 'Token manquant.' }, { status: 400 });
  }
  try {
    const response = await fetch(buildPublicApiUrl('/api/newsletter/unsubscribe/'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: body.token.trim() }), cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({ message: 'Réponse newsletter invalide.' }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Service newsletter temporairement indisponible.' }, { status: 502 });
  }
}
