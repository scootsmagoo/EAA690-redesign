/**
 * Better Auth 1.7 upgrade shim: the `account` table gained a required `issuer`
 * column (identity namespace, unique together with `accountId`).
 *
 * Better Auth's built-in `runMigrations()` refuses to add a NOT NULL column to a
 * populated table (no default to backfill), so every sign-in on an upgraded
 * database failed with a 500 before the password was even checked. This adds
 * the column nullable, backfills the values the upgrade guide prescribes, and
 * then tightens it to NOT NULL on Postgres. Must run BEFORE `runMigrations()`.
 *
 * Backfill values (https://better-auth.com/docs/guides/1-7-upgrade-guide):
 *   - email/password rows (providerId = 'credential') -> 'local:credential'
 *   - any other provider                              -> 'local:oauth:<providerId>'
 *
 * Idempotent: no-op once the column exists. Follows the same Postgres + SQLite
 * dual-backend pattern as account-approval-db.ts.
 */

import { getPgPool } from './pg-pool'
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from './db-resolver'

function usingPostgres(): boolean {
  const url = getEffectiveDatabaseUrl()
  return !!url && isPostgresUrl(url)
}

function openSqlite() {
  const url = getEffectiveDatabaseUrl()!
  const Database = require('better-sqlite3') as typeof import('better-sqlite3')
  return new Database(resolveSqliteFilePath(url))
}

export async function ensureAccountIssuerColumn(): Promise<void> {
  if (!getEffectiveDatabaseUrl()) return

  if (usingPostgres()) {
    const pool = getPgPool()
    const exists = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'account' LIMIT 1`
    )
    // Fresh database: let Better Auth create the table with the 1.7 schema.
    if (exists.rowCount === 0) return

    const col = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'account' AND column_name = 'issuer' LIMIT 1`
    )
    if ((col.rowCount ?? 0) > 0) return

    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" TEXT`)
    await pool.query(`
      UPDATE "account"
      SET "issuer" = CASE
        WHEN "providerId" = 'credential' THEN 'local:credential'
        ELSE 'local:oauth:' || "providerId"
      END
      WHERE "issuer" IS NULL
    `)
    await pool.query(`ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL`)
    console.log('Better Auth 1.7: backfilled account.issuer (Postgres)')
    return
  }

  const db = openSqlite()
  try {
    const table = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'account'`)
      .get()
    if (!table) return

    const cols = db.prepare(`PRAGMA table_info("account")`).all() as Array<{ name: string }>
    if (cols.some((c) => c.name === 'issuer')) return

    // SQLite cannot add a NOT NULL column without a default, nor alter one later;
    // Better Auth only checks the column exists, so nullable is sufficient here.
    db.exec(`ALTER TABLE "account" ADD COLUMN "issuer" TEXT`)
    db.prepare(`
      UPDATE "account"
      SET "issuer" = CASE
        WHEN "providerId" = 'credential' THEN 'local:credential'
        ELSE 'local:oauth:' || "providerId"
      END
      WHERE "issuer" IS NULL
    `).run()
    console.log('Better Auth 1.7: backfilled account.issuer (SQLite)')
  } finally {
    db.close()
  }
}
