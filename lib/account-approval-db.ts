import { Pool } from 'pg'
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from './db-resolver'

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export type UserApprovalState = {
  id: string
  name: string | null
  email: string
  role: string | null
  approvalStatus: ApprovalStatus
  approvedAt: string | null
  approvedBy: string | null
  rejectedAt: string | null
  rejectedBy: string | null
  rejectionReason: string | null
  createdAt: string | null
}

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

function normalizeApprovalStatus(value: unknown): ApprovalStatus {
  return APPROVAL_STATUSES.includes(value as ApprovalStatus)
    ? (value as ApprovalStatus)
    : 'pending'
}

function mapApprovalRow(row: Record<string, unknown>): UserApprovalState {
  return {
    id: String(row.id),
    name: typeof row.name === 'string' ? row.name : null,
    email: String(row.email),
    role: typeof row.role === 'string' ? row.role : null,
    approvalStatus: normalizeApprovalStatus(row.approvalStatus),
    approvedAt: typeof row.approvedAt === 'string' ? row.approvedAt : row.approvedAt ? String(row.approvedAt) : null,
    approvedBy: typeof row.approvedBy === 'string' ? row.approvedBy : null,
    rejectedAt: typeof row.rejectedAt === 'string' ? row.rejectedAt : row.rejectedAt ? String(row.rejectedAt) : null,
    rejectedBy: typeof row.rejectedBy === 'string' ? row.rejectedBy : null,
    rejectionReason: typeof row.rejectionReason === 'string' ? row.rejectionReason : null,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : row.createdAt ? String(row.createdAt) : null,
  }
}

let schemaReady: Promise<void> | null = null

/**
 * Idempotently adds approval metadata to Better Auth's user table.
 * Existing rows are backfilled as approved so current admins/members are not locked out;
 * the column default then makes future signups pending until reviewed.
 */
export async function ensureUserApprovalSchema(): Promise<void> {
  if (!getEffectiveDatabaseUrl()) return
  if (!schemaReady) {
    schemaReady = (async () => {
      if (usingPostgres()) {
        const pool = makePool()
        try {
          await pool.query(`
            ALTER TABLE "user"
              ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT,
              ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP,
              ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
              ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP,
              ADD COLUMN IF NOT EXISTS "rejectedBy" TEXT,
              ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT
          `)
          await pool.query(`
            UPDATE "user"
            SET
              "approvalStatus" = 'approved',
              "approvedAt" = COALESCE("approvedAt", "createdAt", NOW())
            WHERE "approvalStatus" IS NULL
          `)
          await pool.query(`ALTER TABLE "user" ALTER COLUMN "approvalStatus" SET DEFAULT 'pending'`)
        } finally {
          await pool.end().catch(() => {})
        }
        return
      }

      const db = openSqlite()
      try {
        const cols = db.prepare(`PRAGMA table_info("user")`).all() as Array<{ name: string }>
        const has = (name: string) => cols.some((c) => c.name === name)
        const addedApprovalStatus = !has('approvalStatus')

        if (addedApprovalStatus) {
          db.exec(`ALTER TABLE "user" ADD COLUMN "approvalStatus" TEXT DEFAULT 'pending'`)
        }
        if (!has('approvedAt')) db.exec(`ALTER TABLE "user" ADD COLUMN "approvedAt" TEXT`)
        if (!has('approvedBy')) db.exec(`ALTER TABLE "user" ADD COLUMN "approvedBy" TEXT`)
        if (!has('rejectedAt')) db.exec(`ALTER TABLE "user" ADD COLUMN "rejectedAt" TEXT`)
        if (!has('rejectedBy')) db.exec(`ALTER TABLE "user" ADD COLUMN "rejectedBy" TEXT`)
        if (!has('rejectionReason')) db.exec(`ALTER TABLE "user" ADD COLUMN "rejectionReason" TEXT`)

        if (addedApprovalStatus) {
          db.prepare(`
            UPDATE "user"
            SET
              "approvalStatus" = 'approved',
              "approvedAt" = COALESCE("approvedAt", "createdAt", datetime('now'))
            WHERE "approvalStatus" = 'pending'
          `).run()
        } else {
          db.prepare(`
            UPDATE "user"
            SET
              "approvalStatus" = 'approved',
              "approvedAt" = COALESCE("approvedAt", "createdAt", datetime('now'))
            WHERE "approvalStatus" IS NULL
          `).run()
        }
      } finally {
        db.close()
      }
    })().catch((err) => {
      const msg = err instanceof Error ? err.message : ''
      if (/duplicate column|already exists/i.test(msg)) return
      schemaReady = null
      throw err
    })
  }
  await schemaReady
}

export function isApprovedUser(user: { role?: string | null; approvalStatus?: string | null } | null | undefined): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.approvalStatus === 'approved'
}

export async function getUserApprovalState(userId: string): Promise<UserApprovalState | null> {
  if (!userId) return null
  await ensureUserApprovalSchema()
  if (!getEffectiveDatabaseUrl()) return null

  if (usingPostgres()) {
    const pool = makePool()
    try {
      const res = await pool.query(
        `SELECT id, name, email, role, "approvalStatus", "approvedAt", "approvedBy",
                "rejectedAt", "rejectedBy", "rejectionReason", "createdAt"
         FROM "user"
         WHERE id = $1
         LIMIT 1`,
        [userId]
      )
      return res.rows[0] ? mapApprovalRow(res.rows[0]) : null
    } finally {
      await pool.end().catch(() => {})
    }
  }

  const db = openSqlite()
  try {
    const row = db
      .prepare(
        `SELECT id, name, email, role, "approvalStatus", "approvedAt", "approvedBy",
                "rejectedAt", "rejectedBy", "rejectionReason", "createdAt"
         FROM "user"
         WHERE id = ?
         LIMIT 1`
      )
      .get(userId) as Record<string, unknown> | undefined
    return row ? mapApprovalRow(row) : null
  } finally {
    db.close()
  }
}

export async function listUsersByApprovalStatus(status?: ApprovalStatus): Promise<UserApprovalState[]> {
  await ensureUserApprovalSchema()
  if (!getEffectiveDatabaseUrl()) return []

  if (usingPostgres()) {
    const pool = makePool()
    try {
      const values = status ? [status] : []
      const res = await pool.query(
        `SELECT id, name, email, role, "approvalStatus", "approvedAt", "approvedBy",
                "rejectedAt", "rejectedBy", "rejectionReason", "createdAt"
         FROM "user"
         ${status ? 'WHERE "approvalStatus" = $1' : ''}
         ORDER BY
           CASE "approvalStatus" WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
           "createdAt" DESC`,
        values
      )
      return res.rows.map((row) => mapApprovalRow(row))
    } finally {
      await pool.end().catch(() => {})
    }
  }

  const db = openSqlite()
  try {
    const sql = `
      SELECT id, name, email, role, "approvalStatus", "approvedAt", "approvedBy",
             "rejectedAt", "rejectedBy", "rejectionReason", "createdAt"
      FROM "user"
      ${status ? 'WHERE "approvalStatus" = ?' : ''}
      ORDER BY
        CASE "approvalStatus" WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
        "createdAt" DESC
    `
    const rows = status
      ? db.prepare(sql).all(status)
      : db.prepare(sql).all()
    return (rows as Array<Record<string, unknown>>).map((row) => mapApprovalRow(row))
  } finally {
    db.close()
  }
}

export async function setUserApprovalStatus(args: {
  userId: string
  status: ApprovalStatus
  actorId: string
  reason?: string | null
}): Promise<UserApprovalState | null> {
  const reason = args.reason?.trim().slice(0, 500) || null
  await ensureUserApprovalSchema()
  if (!getEffectiveDatabaseUrl()) return null

  if (usingPostgres()) {
    const pool = makePool()
    try {
      const res = await pool.query(
        args.status === 'approved'
          ? `UPDATE "user"
             SET "approvalStatus" = 'approved',
                 "approvedAt" = NOW(),
                 "approvedBy" = $2,
                 "rejectedAt" = NULL,
                 "rejectedBy" = NULL,
                 "rejectionReason" = NULL
             WHERE id = $1
             RETURNING id, name, email, role, "approvalStatus", "approvedAt", "approvedBy",
                       "rejectedAt", "rejectedBy", "rejectionReason", "createdAt"`
          : `UPDATE "user"
             SET "approvalStatus" = $3,
                 "rejectedAt" = CASE WHEN $3 = 'rejected' THEN NOW() ELSE "rejectedAt" END,
                 "rejectedBy" = CASE WHEN $3 = 'rejected' THEN $2 ELSE "rejectedBy" END,
                 "rejectionReason" = CASE WHEN $3 = 'rejected' THEN $4 ELSE "rejectionReason" END
             WHERE id = $1
             RETURNING id, name, email, role, "approvalStatus", "approvedAt", "approvedBy",
                       "rejectedAt", "rejectedBy", "rejectionReason", "createdAt"`,
        args.status === 'approved'
          ? [args.userId, args.actorId]
          : [args.userId, args.actorId, args.status, reason]
      )
      return res.rows[0] ? mapApprovalRow(res.rows[0]) : null
    } finally {
      await pool.end().catch(() => {})
    }
  }

  const db = openSqlite()
  try {
    if (args.status === 'approved') {
      db.prepare(`
        UPDATE "user"
        SET "approvalStatus" = 'approved',
            "approvedAt" = datetime('now'),
            "approvedBy" = ?,
            "rejectedAt" = NULL,
            "rejectedBy" = NULL,
            "rejectionReason" = NULL
        WHERE id = ?
      `).run(args.actorId, args.userId)
    } else {
      db.prepare(`
        UPDATE "user"
        SET "approvalStatus" = ?,
            "rejectedAt" = CASE WHEN ? = 'rejected' THEN datetime('now') ELSE "rejectedAt" END,
            "rejectedBy" = CASE WHEN ? = 'rejected' THEN ? ELSE "rejectedBy" END,
            "rejectionReason" = CASE WHEN ? = 'rejected' THEN ? ELSE "rejectionReason" END
        WHERE id = ?
      `).run(args.status, args.status, args.status, args.actorId, args.status, reason, args.userId)
    }
  } finally {
    db.close()
  }
  return getUserApprovalState(args.userId)
}
