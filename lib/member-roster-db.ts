import { getPgPool } from './pg-pool'
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from './db-resolver'
import { normalizeEmail, type RosterEntry } from './member-roster'

/**
 * Storage for the imported chapter roster (see lib/member-roster.ts).
 *
 * `member_roster` holds one row per email, replaced wholesale on every import.
 * `member_roster_import` is a small audit log of who imported when.
 */

export type RosterSummary = {
  entryCount: number
  importedAt: string | null
  importedBy: string | null
}

export type RosterMatch = Pick<RosterEntry, 'memberType' | 'expiresOn'>

function usingPostgres(): boolean {
  const url = getEffectiveDatabaseUrl()
  return !!url && isPostgresUrl(url)
}

function openSqlite() {
  const url = getEffectiveDatabaseUrl()!
  const Database = require('better-sqlite3') as typeof import('better-sqlite3')
  return new Database(resolveSqliteFilePath(url))
}

let schemaReady: Promise<void> | null = null

export async function ensureMemberRosterSchema(): Promise<void> {
  if (!getEffectiveDatabaseUrl()) return
  if (!schemaReady) {
    schemaReady = (async () => {
      if (usingPostgres()) {
        const pool = getPgPool()
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "member_roster" (
            "email" TEXT PRIMARY KEY,
            "firstName" TEXT,
            "lastName" TEXT,
            "memberType" TEXT,
            "eaaNumber" TEXT,
            "expiresOn" TEXT,
            "importedAt" TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `)
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "member_roster_import" (
            "id" SERIAL PRIMARY KEY,
            "importedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "importedBy" TEXT,
            "entryCount" INTEGER NOT NULL
          )
        `)
        return
      }
      const db = openSqlite()
      try {
        db.exec(`
          CREATE TABLE IF NOT EXISTS "member_roster" (
            "email" TEXT PRIMARY KEY,
            "firstName" TEXT,
            "lastName" TEXT,
            "memberType" TEXT,
            "eaaNumber" TEXT,
            "expiresOn" TEXT,
            "importedAt" TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE TABLE IF NOT EXISTS "member_roster_import" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "importedAt" TEXT NOT NULL DEFAULT (datetime('now')),
            "importedBy" TEXT,
            "entryCount" INTEGER NOT NULL
          );
        `)
      } finally {
        db.close()
      }
    })().catch((err) => {
      schemaReady = null
      throw err
    })
  }
  await schemaReady
}

/** Replace the whole roster in one transaction and log the import. */
export async function replaceMemberRoster(entries: RosterEntry[], importedBy: string): Promise<void> {
  await ensureMemberRosterSchema()
  if (!getEffectiveDatabaseUrl()) throw new Error('No database configured')

  if (usingPostgres()) {
    const client = await getPgPool().connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM "member_roster"')
      // Chunked multi-row inserts: a few hundred rows, so a handful of statements.
      const CHUNK = 200
      for (let i = 0; i < entries.length; i += CHUNK) {
        const chunk = entries.slice(i, i + CHUNK)
        const values: unknown[] = []
        const tuples = chunk.map((e, j) => {
          values.push(e.email, e.firstName, e.lastName, e.memberType, e.eaaNumber, e.expiresOn)
          const b = j * 6
          return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6})`
        })
        await client.query(
          `INSERT INTO "member_roster" ("email", "firstName", "lastName", "memberType", "eaaNumber", "expiresOn")
           VALUES ${tuples.join(', ')}`,
          values
        )
      }
      await client.query(
        'INSERT INTO "member_roster_import" ("importedBy", "entryCount") VALUES ($1, $2)',
        [importedBy, entries.length]
      )
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
    return
  }

  const db = openSqlite()
  try {
    const insert = db.prepare(
      `INSERT INTO "member_roster" ("email", "firstName", "lastName", "memberType", "eaaNumber", "expiresOn")
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    db.transaction(() => {
      db.prepare('DELETE FROM "member_roster"').run()
      for (const e of entries) {
        insert.run(e.email, e.firstName, e.lastName, e.memberType, e.eaaNumber, e.expiresOn)
      }
      db.prepare('INSERT INTO "member_roster_import" ("importedBy", "entryCount") VALUES (?, ?)').run(
        importedBy,
        entries.length
      )
    })()
  } finally {
    db.close()
  }
}

export async function getRosterSummary(): Promise<RosterSummary> {
  await ensureMemberRosterSchema()
  const empty: RosterSummary = { entryCount: 0, importedAt: null, importedBy: null }
  if (!getEffectiveDatabaseUrl()) return empty

  const countSql = 'SELECT COUNT(*) AS n FROM "member_roster"'
  const lastSql = `SELECT "importedAt", "importedBy" FROM "member_roster_import" ORDER BY "id" DESC LIMIT 1`
  if (usingPostgres()) {
    const pool = getPgPool()
    const [count, last] = await Promise.all([pool.query(countSql), pool.query(lastSql)])
    const row = last.rows[0]
    return {
      entryCount: Number(count.rows[0]?.n ?? 0),
      importedAt: row?.importedAt ? new Date(row.importedAt).toISOString() : null,
      importedBy: row?.importedBy ?? null,
    }
  }
  const db = openSqlite()
  try {
    const n = (db.prepare(countSql).get() as { n: number }).n
    const row = db.prepare(lastSql).get() as { importedAt: string; importedBy: string | null } | undefined
    return {
      entryCount: Number(n),
      // SQLite datetime('now') is UTC without a zone marker.
      importedAt: row?.importedAt ? new Date(`${row.importedAt.replace(' ', 'T')}Z`).toISOString() : null,
      importedBy: row?.importedBy ?? null,
    }
  } finally {
    db.close()
  }
}

/** Roster rows for the given emails, keyed by normalized email. */
export async function getRosterMatches(emails: string[]): Promise<Map<string, RosterMatch>> {
  await ensureMemberRosterSchema()
  const out = new Map<string, RosterMatch>()
  const wanted = Array.from(new Set(emails.map(normalizeEmail).filter(Boolean)))
  if (!getEffectiveDatabaseUrl() || wanted.length === 0) return out

  if (usingPostgres()) {
    const res = await getPgPool().query(
      `SELECT "email", "memberType", "expiresOn" FROM "member_roster" WHERE "email" = ANY($1::text[])`,
      [wanted]
    )
    for (const r of res.rows) out.set(r.email, { memberType: r.memberType, expiresOn: r.expiresOn })
    return out
  }
  const db = openSqlite()
  try {
    const stmt = db.prepare(`SELECT "email", "memberType", "expiresOn" FROM "member_roster" WHERE "email" = ?`)
    for (const email of wanted) {
      const r = stmt.get(email) as { email: string; memberType: string | null; expiresOn: string | null } | undefined
      if (r) out.set(r.email, { memberType: r.memberType, expiresOn: r.expiresOn })
    }
    return out
  } finally {
    db.close()
  }
}

export type PendingVerifiedUser = { id: string; email: string }

/**
 * Pending accounts whose email address has been verified. `userId` narrows the
 * lookup to one account (used right after a member verifies their email).
 */
export async function listPendingVerifiedUsers(userId?: string): Promise<PendingVerifiedUser[]> {
  if (!getEffectiveDatabaseUrl()) return []
  if (usingPostgres()) {
    const res = await getPgPool().query(
      `SELECT id, email FROM "user"
       WHERE "approvalStatus" = 'pending' AND "emailVerified" = true
       ${userId ? 'AND id = $1' : ''}`,
      userId ? [userId] : []
    )
    return res.rows.map((r) => ({ id: String(r.id), email: String(r.email) }))
  }
  const db = openSqlite()
  try {
    const sql = `SELECT id, email FROM "user"
                 WHERE "approvalStatus" = 'pending' AND "emailVerified" = 1
                 ${userId ? 'AND id = ?' : ''}`
    const rows = (userId ? db.prepare(sql).all(userId) : db.prepare(sql).all()) as Array<{ id: unknown; email: unknown }>
    return rows.map((r) => ({ id: String(r.id), email: String(r.email) }))
  } finally {
    db.close()
  }
}
