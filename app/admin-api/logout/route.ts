import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: 'Authentification admin désactivée : aucune session à fermer.'
  });
}
