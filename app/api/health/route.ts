import { NextResponse } from 'next/server'
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from '@/lib/db-resolver'
import { getPgPool } from '@/lib/pg-pool'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health — unauthenticated liveness + dependency check for uptime monitors.
 *
 * Deliberately terse: reports only pass/fail per check, never connection details,
 * versions, or error text (see the admin-only /api/test-db for diagnostics).
 * Returns 200 when every check passes, 503 otherwise.
 */
type CheckResult = 'ok' | 'fail' | 'skipped'

async function checkDatabase(): Promise<CheckResult> {
  const url = getEffectiveDatabaseUrl()
  if (!url) return 'skipped'
  try {
    if (isPostgresUrl(url)) {
      await getPgPool().query('SELECT 1')
      return 'ok'
    }
    const Database = require('better-sqlite3') as typeof import('better-sqlite3')
    const db = new Database(resolveSqliteFilePath(url), { readonly: true })
    try {
      db.prepare('SELECT 1').get()
    } finally {
      db.close()
    }
    return 'ok'
  } catch (err) {
    console.error('health: database check failed:', err instanceof Error ? err.message : err)
    return 'fail'
  }
}

function checkAuthConfig(): CheckResult {
  // In production a real secret is mandatory; locally the dev fallback is acceptable.
  if (process.env.NODE_ENV !== 'production') return 'ok'
  const secret = process.env.BETTER_AUTH_SECRET?.trim()
  return secret && secret.length >= 32 ? 'ok' : 'fail'
}

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    auth: checkAuthConfig(),
  }
  const ok = Object.values(checks).every((c) => c !== 'fail')
  return NextResponse.json(
    { ok, checks },
    {
      status: ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
