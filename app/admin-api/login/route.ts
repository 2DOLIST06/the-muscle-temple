import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: 'Authentification admin désactivée : accès direct activé.'
  });
}
