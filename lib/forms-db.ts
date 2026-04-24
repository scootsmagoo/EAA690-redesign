import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from './db-resolver'

export type FormType = 'summer_camp' | 'scholarship' | 'vmc_imc' | 'youth_aviation' | 'outreach'
export type ProgramFormType = FormType
/** All rows in `form_submissions`, including the public /contact form. */
export type SubmissionFormType = FormType | 'contact'
export type SubmissionStatus = 'pending' | 'reviewed' | 'accepted' | 'declined'

const PROGRAM_FORM_TYPES: FormType[] = [
  'summer_camp',
  'scholarship',
  'vmc_imc',
  'youth_aviation',
  'outreach',
]

export interface FormSubmission {
  id: string
  form_type: SubmissionFormType
  submitted_at: string
  data: Record<string, unknown>
  status: SubmissionStatus
}

const POSTGRES_DDL = `
  CREATE TABLE IF NOT EXISTS form_submissions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type   TEXT        NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data        JSONB       NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'pending'
  );
`

const SQLITE_DDL = `
  CREATE TABLE IF NOT EXISTS form_submissions (
    id           TEXT PRIMARY KEY,
    form_type    TEXT NOT NULL,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
    data         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending'
  );
`

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

async function ensureTable(): Promise<void> {
  if (usingPostgres()) {
    const pool = makePool()
    try {
      await pool.query(POSTGRES_DDL)
    } finally {
      await pool.end().catch(() => {})
    }
  } else {
    const db = openSqlite()
    db.exec(SQLITE_DDL)
    db.close()
  }
}

export async function insertContactSubmission(
  data: Record<string, unknown>
): Promise<string> {
  return insertSubmissionRow('contact', data)
}

export async function insertSubmission(
  form_type: FormType,
  data: Record<string, unknown>
): Promise<string> {
  return insertSubmissionRow(form_type, data)
}

async function insertSubmissionRow(
  form_type: SubmissionFormType,
  data: Record<string, unknown>
): Promise<string> {
  await ensureTable()
  const id = randomUUID()
  const json = JSON.stringify(data)

  if (usingPostgres()) {
    const pool = makePool()
    try {
      const result = await pool.query(
        `INSERT INTO form_submissions (id, form_type, data)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [id, form_type, json]
      )
      return result.rows[0].id as string
    } finally {
      await pool.end().catch(() => {})
    }
  } else {
    const db = openSqlite()
    db.prepare(
      `INSERT INTO form_submissions (id, form_type, data) VALUES (?, ?, ?)`
    ).run(id, form_type, json)
    db.close()
    return id
  }
}

export async function getSubmissions(form_type?: FormType): Promise<FormSubmission[]> {
  await ensureTable()

  if (usingPostgres()) {
    const pool = makePool()
    try {
      const result = form_type
        ? await pool.query(
            `SELECT id, form_type, submitted_at, data, status
             FROM form_submissions
             WHERE form_type = $1
             ORDER BY submitted_at DESC`,
            [form_type]
          )
        : await pool.query(
            `SELECT id, form_type, submitted_at, data, status
             FROM form_submissions
             WHERE form_type IN ($1, $2, $3, $4, $5)
             ORDER BY submitted_at DESC`,
            [...PROGRAM_FORM_TYPES]
          )
      return result.rows.map((r) => ({
        id: r.id,
        form_type: r.form_type as SubmissionFormType,
        submitted_at:
          r.submitted_at instanceof Date
            ? r.submitted_at.toISOString()
            : String(r.submitted_at),
        data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
        status: r.status as SubmissionStatus,
      }))
    } finally {
      await pool.end().catch(() => {})
    }
  } else {
    const db = openSqlite()
    const rows = (
      form_type
        ? db
            .prepare(
              `SELECT id, form_type, submitted_at, data, status
               FROM form_submissions
               WHERE form_type = ?
               ORDER BY submitted_at DESC`
            )
            .all(form_type)
        : db
            .prepare(
              `SELECT id, form_type, submitted_at, data, status
               FROM form_submissions
               WHERE form_type IN (?, ?, ?, ?, ?)
               ORDER BY submitted_at DESC`
            )
            .all(
              PROGRAM_FORM_TYPES[0],
              PROGRAM_FORM_TYPES[1],
              PROGRAM_FORM_TYPES[2],
              PROGRAM_FORM_TYPES[3],
              PROGRAM_FORM_TYPES[4]
            )
    ) as Array<{
      id: string
      form_type: string
      submitted_at: string
      data: string
      status: string
    }>
    db.close()
    return rows.map((r) => ({
      id: r.id,
      form_type: r.form_type as SubmissionFormType,
      submitted_at: r.submitted_at,
      data: JSON.parse(r.data),
      status: r.status as SubmissionStatus,
    }))
  }
}

export async function isContactSubmissionId(id: string): Promise<boolean> {
  await ensureTable()
  if (usingPostgres()) {
    const pool = makePool()
    try {
      const r = await pool.query(
        `SELECT 1 FROM form_submissions WHERE id = $1 AND form_type = 'contact' LIMIT 1`,
        [id]
      )
      return r.rowCount! > 0
    } finally {
      await pool.end().catch(() => {})
    }
  } else {
    const db = openSqlite()
    const row = db
      .prepare(
        `SELECT 1 AS ok FROM form_submissions WHERE id = ? AND form_type = 'contact' LIMIT 1`
      )
      .get(id) as { ok: number } | undefined
    db.close()
    return !!row
  }
}

export async function getContactSubmissions(): Promise<FormSubmission[]> {
  await ensureTable()
  if (usingPostgres()) {
    const pool = makePool()
    try {
      const result = await pool.query(
        `SELECT id, form_type, submitted_at, data, status
         FROM form_submissions
         WHERE form_type = 'contact'
         ORDER BY submitted_at DESC`
      )
      return result.rows.map((r) => ({
        id: r.id,
        form_type: r.form_type as SubmissionFormType,
        submitted_at:
          r.submitted_at instanceof Date
            ? r.submitted_at.toISOString()
            : String(r.submitted_at),
        data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
        status: r.status as SubmissionStatus,
      }))
    } finally {
      await pool.end().catch(() => {})
    }
  } else {
    const db = openSqlite()
    const rows = db
      .prepare(
        `SELECT id, form_type, submitted_at, data, status
         FROM form_submissions
         WHERE form_type = 'contact'
         ORDER BY submitted_at DESC`
      )
      .all() as Array<{
      id: string
      form_type: string
      submitted_at: string
      data: string
      status: string
    }>
    db.close()
    return rows.map((r) => ({
      id: r.id,
      form_type: r.form_type as SubmissionFormType,
      submitted_at: r.submitted_at,
      data: JSON.parse(r.data),
      status: r.status as SubmissionStatus,
    }))
  }
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus
): Promise<void> {
  await ensureTable()
  if (usingPostgres()) {
    const pool = makePool()
    try {
      await pool.query(
        `UPDATE form_submissions SET status = $1 WHERE id = $2`,
        [status, id]
      )
    } finally {
      await pool.end().catch(() => {})
    }
  } else {
    const db = openSqlite()
    db.prepare(`UPDATE form_submissions SET status = ? WHERE id = ?`).run(status, id)
    db.close()
  }
}
