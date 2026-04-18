/**
 * Per-user preferences persistence.
 *
 * We store preferences as a JSON string on a `preferences` column added to the
 * Better Auth `user` table. This avoids:
 *   - bloating the session cookie with prefs (Better Auth would do that if we
 *     used `additionalFields`),
 *   - introducing a second auth-aware table that we'd have to keep in sync,
 *   - cross-DB type mismatches (TEXT works on both Postgres and SQLite).
 *
 * The column is created lazily on first read/write, so existing deployments
 * don't need a manual migration step. A standalone `scripts/add-preferences-column.ts`
 * is also provided for ops who prefer explicit migrations.
 *
 * Security:
 *   - We pass the JSON string through `serializePreferences` (which re-runs
 *     `parsePreferences`) on every write, so untrusted JSON cannot leak into
 *     the DB or, later, back into a `<script>` tag.
 *   - All DB calls are parameterized — no string interpolation of userId or
 *     payload values.
 */

import { Pool } from 'pg'
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from './db-resolver'
import {
  DEFAULT_PREFERENCES,
  parsePreferences,
  serializePreferences,
  type UserPreferences,
} from './preferences'

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

let columnReady: Promise<void> | null = null

/** Idempotent: ensures the `user.preferences` column exists. */
async function ensureColumn(): Promise<void> {
  if (!getEffectiveDatabaseUrl()) return
  if (!columnReady) {
    columnReady = (async () => {
      if (usingPostgres()) {
        const pool = makePool()
        try {
          await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS preferences TEXT`)
        } finally {
          await pool.end().catch(() => {})
        }
      } else {
        const db = openSqlite()
        try {
          // SQLite has no IF NOT EXISTS for ADD COLUMN — probe the schema first.
          const cols = db
            .prepare(`PRAGMA table_info("user")`)
            .all() as Array<{ name: string }>
          if (!cols.some((c) => c.name === 'preferences')) {
            db.exec(`ALTER TABLE "user" ADD COLUMN preferences TEXT`)
          }
        } finally {
          db.close()
        }
      }
    })().catch((err) => {
      // Reset so the next call can retry; ignore "duplicate column" races.
      const msg = err instanceof Error ? err.message : ''
      if (/duplicate column|already exists/i.test(msg)) return
      columnReady = null
      throw err
    })
  }
  await columnReady
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  if (!userId) return { ...DEFAULT_PREFERENCES }
  await ensureColumn()

  if (usingPostgres()) {
    const pool = makePool()
    try {
      const res = await pool.query<{ preferences: string | null }>(
        `SELECT preferences FROM "user" WHERE id = $1 LIMIT 1`,
        [userId]
      )
      const raw = res.rows[0]?.preferences
      if (!raw) return { ...DEFAULT_PREFERENCES }
      try {
        return parsePreferences(JSON.parse(raw))
      } catch {
        return { ...DEFAULT_PREFERENCES }
      }
    } finally {
      await pool.end().catch(() => {})
    }
  }

  const db = openSqlite()
  try {
    const row = db
      .prepare(`SELECT preferences FROM "user" WHERE id = ? LIMIT 1`)
      .get(userId) as { preferences: string | null } | undefined
    const raw = row?.preferences
    if (!raw) return { ...DEFAULT_PREFERENCES }
    try {
      return parsePreferences(JSON.parse(raw))
    } catch {
      return { ...DEFAULT_PREFERENCES }
    }
  } finally {
    db.close()
  }
}

export async function setUserPreferences(
  userId: string,
  patch: Partial<UserPreferences>
): Promise<UserPreferences> {
  if (!userId) throw new Error('setUserPreferences: userId required')
  await ensureColumn()
  // Re-validate so a malicious caller can't smuggle unknown keys into the DB.
  const merged = parsePreferences({ ...DEFAULT_PREFERENCES, ...patch })
  const serialized = serializePreferences(merged)

  if (usingPostgres()) {
    const pool = makePool()
    try {
      await pool.query(`UPDATE "user" SET preferences = $1, "updatedAt" = NOW() WHERE id = $2`, [
        serialized,
        userId,
      ])
    } finally {
      await pool.end().catch(() => {})
    }
  } else {
    const db = openSqlite()
    try {
      db.prepare(
        `UPDATE "user" SET preferences = ?, "updatedAt" = datetime('now') WHERE id = ?`
      ).run(serialized, userId)
    } finally {
      db.close()
    }
  }

  return merged
}
