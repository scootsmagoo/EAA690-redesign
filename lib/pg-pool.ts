import { Pool } from 'pg'
import { getEffectiveDatabaseUrl, isPostgresUrl } from './db-resolver'

/**
 * Process-wide Postgres pool.
 *
 * Every DB helper used to create its own `new Pool()` and `pool.end()` per call,
 * which on Vercel + Supabase's transaction pooler meant a fresh TCP + TLS
 * handshake for every query and a real risk of exhausting pooler connections.
 * One lazy singleton per serverless instance is the standard pattern; the pool
 * is never ended explicitly — the instance is simply frozen/recycled.
 *
 * Callers must only use this when `isPostgresUrl(getEffectiveDatabaseUrl())`
 * is true; SQLite callers open the file directly.
 */
let _pool: Pool | null = null

export function getPgPool(): Pool {
  if (_pool) return _pool

  const url = getEffectiveDatabaseUrl()
  if (!url || !isPostgresUrl(url)) {
    throw new Error('getPgPool(): no Postgres DATABASE_URL is configured')
  }

  _pool = new Pool({
    connectionString: url,
    // Hosted Postgres (Supabase, Neon) terminates TLS with certs Node cannot
    // verify by default. The connection is still encrypted; only the server
    // certificate check is skipped — scoped to this pool, never process-wide.
    ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  })

  _pool.on('error', (err) => {
    console.error('Postgres pool error:', {
      message: err.message,
      code: (err as { code?: string })?.code,
    })
  })

  return _pool
}
