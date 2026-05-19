import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StepResult = {
  step: string
  ok: boolean
  detail?: string
  data?: unknown
}

async function runSqlReadOnly(payload: any, table: string) {
  const query = `SELECT COUNT(*)::int AS count FROM ${table}`

  if (payload?.db?.pool?.query) {
    const result = await payload.db.pool.query(query)
    return { count: Number(result?.rows?.[0]?.count ?? 0), driver: 'db.pool.query' }
  }

  if (payload?.db?.drizzle?.execute) {
    const result = await payload.db.drizzle.execute(query)
    const row = result?.rows?.[0] ?? result?.[0] ?? {}
    return { count: Number(row?.count ?? 0), driver: 'db.drizzle.execute' }
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
