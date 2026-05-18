import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    return NextResponse.json({
      ok: true,
      message: 'Payload initialized',
      collections: Object.keys(payload.collections || {}),
      env: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasPayloadSecret: Boolean(process.env.PAYLOAD_SECRET),
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error('DEBUG_PAYLOAD_ERROR:', error)

    return NextResponse.json(
      {
        ok: false,
        message: 'Payload initialization failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        env: {
          hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
          hasPayloadSecret: Boolean(process.env.PAYLOAD_SECRET),
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    )
  }
}
