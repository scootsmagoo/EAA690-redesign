/**
 * Stripe Customer ID persistence layer for Better Auth's user table.
 *
 * Populated by the `checkout.session.completed` webhook when a member
 * completes their first payment. The Stripe Customer Portal
 * (/api/stripe/portal) and subscription-management workflows read this
 * value — without it, the portal is unusable and subscription status
 * cannot be synced.
 *
 * Follows the same Postgres + SQLite dual-backend pattern as
 * account-approval-db.ts and forms-db.ts.
 */

import { Pool } from 'pg'
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from './db-resolver'

function usingPostgres(): boolean {
  const url = getEffectiveDatabaseUrl()
  return !!url && isPostgresUrl(url)
}

function makePool(): Pool {
  const url = getEffectiveDatabaseUrl()!
  return new Pool({
    connectionString: url,
    ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 1,
  })
}

function openSqlite() {
  const url = getEffectiveDatabaseUrl()!
  const Database = require('better-sqlite3') as typeof import('better-sqlite3')
  return new Database(resolveSqliteFilePath(url))
}

/** Idempotent DDL: add `stripeCustomerId` column if missing. */
export async function ensureStripeCustomerIdColumn(): Promise<void> {
  if (!getEffectiveDatabaseUrl()) return

  if (usingPostgres()) {
    const pool = makePool()
    try {
      await pool.query(`
        ALTER TABLE "user"
          ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT
      `)
    } finally {
      await pool.end().catch(() => {})
    }
    return
  }

  const db = openSqlite()
  try {
    const cols = db.prepare(`PRAGMA table_info("user")`).all() as Array<{ name: string }>
    if (!cols.some((c) => c.name === 'stripeCustomerId')) {
      db.exec(`ALTER TABLE "user" ADD COLUMN "stripeCustomerId" TEXT`)
    }
  } finally {
    db.close()
  }
}

/**
 * Store a Stripe customer ID on the given user's record.
 * Matches by email — the webhook has `customer_email` from the
 * Checkout Session but not the Better Auth user ID.
 */
export async function storeStripeCustomerId(args: {
  email: string
  stripeCustomerId: string
}): Promise<boolean> {
  if (!getEffectiveDatabaseUrl()) return false

  const { email, stripeCustomerId } = args
  if (!email || !stripeCustomerId) return false

  await ensureStripeCustomerIdColumn()

  if (usingPostgres()) {
    const pool = makePool()
    try {
      const result = await pool.query(
        `UPDATE "user" SET "stripeCustomerId" = $1
         WHERE LOWER(email) = LOWER($2)
           AND ("stripeCustomerId" IS NULL OR "stripeCustomerId" = $1)
         RETURNING id`,
        [stripeCustomerId, email]
      )
      return (result.rowCount ?? 0) > 0
    } finally {
      await pool.end().catch(() => {})
    }
  }

  const db = openSqlite()
  try {
    const info = db
      .prepare(
        `UPDATE "user" SET "stripeCustomerId" = ?
         WHERE LOWER(email) = LOWER(?)
           AND ("stripeCustomerId" IS NULL OR "stripeCustomerId" = ?)`
      )
      .run(stripeCustomerId, email, stripeCustomerId)
    return info.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Look up a user's Stripe customer ID by email.
 * Returns null when the user doesn't exist or has no customer ID yet.
 */
export async function getStripeCustomerIdByEmail(
  email: string
): Promise<string | null> {
  if (!email || !getEffectiveDatabaseUrl()) return null

  await ensureStripeCustomerIdColumn()

  if (usingPostgres()) {
    const pool = makePool()
    try {
      const result = await pool.query(
        `SELECT "stripeCustomerId" FROM "user"
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [email]
      )
      const val = result.rows[0]?.stripeCustomerId
      return typeof val === 'string' && val.length > 0 ? val : null
    } finally {
      await pool.end().catch(() => {})
    }
  }

  const db = openSqlite()
  try {
    const row = db
      .prepare(
        `SELECT "stripeCustomerId" FROM "user"
         WHERE LOWER(email) = LOWER(?)
         LIMIT 1`
      )
      .get(email) as { stripeCustomerId: string | null } | undefined
    const val = row?.stripeCustomerId
    return typeof val === 'string' && val.length > 0 ? val : null
  } finally {
    db.close()
  }
}
