import { NextResponse } from 'next/server'
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from '@/lib/db-resolver'
import { getPgPool } from '@/lib/pg-pool'
import { getAuth } from '@/lib/better-auth'
import { getSiteBaseURL } from '@/lib/site-url'

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

/**
 * Drives the real Better Auth request pipeline via its built-in `/ok` endpoint.
 * A valid secret and a reachable database are not enough: Better Auth 1.7.3+
 * validates the live schema on every request, so a schema it rejects 500s all of
 * /api/auth/* while the two checks above stay green (Sept 2026 sign-in outage).
 * Cheap once warm — Better Auth caches a clean schema verdict per instance.
 */
async function checkAuthHandler(): Promise<CheckResult> {
  if (!getEffectiveDatabaseUrl()) return 'skipped'
  try {
    const res = await getAuth().handler(new Request(`${getSiteBaseURL()}/api/auth/ok`))
    if (res.ok) return 'ok'
    console.error('health: auth handler check failed with status', res.status)
    return 'fail'
  } catch (err) {
    console.error('health: auth handler check failed:', err instanceof Error ? err.message : err)
    return 'fail'
  }
}

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    auth: checkAuthConfig(),
    authHandler: await checkAuthHandler(),
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
