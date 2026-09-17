/**
 * Better Auth 1.7.0–1.7.2 leftover: the `account.issuer` column.
 *
 * 1.7.0 made `account.issuer` a required column, so this module used to add it,
 * backfill it and set it NOT NULL. Better Auth 1.7.3 reverted that — accounts are
 * identified by `providerId` + `accountId` again, as in 1.6 — and from 1.7.3 on it
 * validates the live schema on every request: a NOT NULL column without a default
 * that it never writes is a "schema mismatch", and EVERY /api/auth/* request
 * (even /api/auth/ok) fails with a 500. That took sign-in down in Sept 2026 after
 * a routine 1.7.2 -> 1.7.4 patch bump.
 *
 * The upgrade guide's fix is to relax the constraint ("Dropping the constraint is
 * enough, and it is reversible"): https://better-auth.com/docs/guides/1-7-upgrade-guide
 * We keep the column and its data; dropping it is optional cleanup for later.
 *
 * Postgres only — on SQLite the column was always added nullable. Idempotent:
 * no-op when the column is absent or already nullable. Must run BEFORE
 * `runMigrations()` / the first auth request.
 */

import { getPgPool } from './pg-pool'
import { getEffectiveDatabaseUrl, isPostgresUrl } from './db-resolver'

export async function relaxAccountIssuerColumn(): Promise<void> {
  const url = getEffectiveDatabaseUrl()
  if (!url || !isPostgresUrl(url)) return

  const pool = getPgPool()
  const col = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'account'
       AND column_name = 'issuer'
       AND is_nullable = 'NO'
     LIMIT 1`
  )
  if ((col.rowCount ?? 0) === 0) return

  await pool.query(`ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL`)
  console.log('Better Auth 1.7.3+: relaxed NOT NULL on account.issuer (Postgres)')
}
