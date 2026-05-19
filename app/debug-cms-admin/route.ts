import { NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StepResult = {
  step: string
  ok: boolean
  detail?: string
  data?: unknown
}

type SqlQueryable = { query: (sql: string) => Promise<{ rows?: Array<{ count?: number | string | null }> }> }
type DrizzleExecutable = { execute: (sql: string) => Promise<{ rows?: Array<{ count?: number | string | null }> } | Array<{ count?: number | string | null }>> }

async function runSqlReadOnly(payload: Payload, table: string) {
  const query = `SELECT COUNT(*)::int AS count FROM ${table}`

  const pool = (payload.db as unknown as { pool?: SqlQueryable }).pool
  if (pool?.query) {
    const result = await pool.query(query)
    return { count: Number(result?.rows?.[0]?.count ?? 0), driver: 'db.pool.query' }
  }

  const drizzle = (payload.db as unknown as { drizzle?: DrizzleExecutable }).drizzle
  if (drizzle?.execute) {
    const result = await drizzle.execute(query)
    const row = Array.isArray(result) ? (result[0] ?? {}) : (result.rows?.[0] ?? {})
    return { count: Number(row.count ?? 0), driver: 'db.drizzle.execute' }
  }

  throw new Error('No SQL execution method found on payload.db (pool.query / drizzle.execute)')
}

export async function GET() {
  const checks: StepResult[] = []
  let currentStep = 'init_payload'

  try {
    const payload = await getPayload({ config })
    checks.push({ step: currentStep, ok: true })

    currentStep = 'collection_users_count'
    const usersCount = await payload.count({ collection: 'users' })
    checks.push({
      step: currentStep,
      ok: true,
      data: { totalDocs: usersCount?.totalDocs ?? 0 },
    })

    for (const table of [
      'payload_preferences',
      'payload_locked_documents',
      'payload_jobs',
      'payload_kv',
    ]) {
      currentStep = `sql_${table}`
      const data = await runSqlReadOnly(payload, table)
      checks.push({ step: currentStep, ok: true, data })
    }

    return NextResponse.json({ ok: true, checks })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    checks.push({ step: currentStep, ok: false, detail: errMsg })

    return NextResponse.json(
      {
        ok: false,
        failedStep: currentStep,
        error: errMsg,
        checks,
      },
      { status: 500 },
    )
  }
}
