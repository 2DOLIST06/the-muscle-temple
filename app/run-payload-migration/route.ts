import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const migrationSecret = process.env.MIGRATION_SECRET

  if (!migrationSecret || secret !== migrationSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      { status: 401 }
    )
  }

  try {
    const payload = await getPayload({ config })
    await payload.db.migrate()

    return NextResponse.json({
      ok: true,
      message: 'Payload migrations completed successfully',
    })
  } catch (error) {
    console.error('PAYLOAD_MIGRATION_ERROR:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
