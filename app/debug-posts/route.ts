import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'posts',
      limit: 5,
      depth: 0,
    })

    return NextResponse.json({
      ok: true,
      totalDocs: result.totalDocs,
      docs: result.docs,
    })
  } catch (error) {
    console.error('DEBUG_POSTS_ERROR:', error)

    return NextResponse.json(
      {
        ok: false,
        message: 'Posts query failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    )
  }
}
