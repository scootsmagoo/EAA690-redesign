/**
 * Apply Better Auth schema migrations (plus our own column backfills) at
 * build/deploy time instead of lazily on the first request.
 *
 * Why: in Sept 2026 the better-auth 1.6 -> 1.7 upgrade added a required
 * column that its runtime migration could not apply to a populated table.
 * Because migrations ran on first login, the deploy "succeeded" and every
 * sign-in then failed with a 500. Running this in `npm run build` makes a
 * broken migration fail the deploy instead of the users.
 *
 * Usage:
 *   npm run migrate            (also runs automatically before `next build`)
 *
 * Skips cleanly when no Postgres URL is configured (fresh clone, CI without a
 * database) — local SQLite is still migrated lazily at runtime as before.
 */
import { config } from 'dotenv'
import path from 'path'

config({ path: path.join(process.cwd(), '.env.local') })
config()

async function main() {
  const { getEffectiveDatabaseUrl, isPostgresUrl } = await import('../lib/db-resolver')
  const url = getEffectiveDatabaseUrl()
  if (!url || !isPostgresUrl(url)) {
    console.log('migrate: no Postgres DATABASE_URL configured — skipping (SQLite migrates lazily).')
    return
  }

  const { ensureBetterAuthSchema } = await import('../lib/better-auth')
  const started = Date.now()
  await ensureBetterAuthSchema()
  console.log(`migrate: schema is up to date (${Date.now() - started} ms).`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('migrate: FAILED —', err instanceof Error ? err.message : err)
    process.exit(1)
  })
