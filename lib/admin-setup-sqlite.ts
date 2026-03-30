import Database from "better-sqlite3"
import { ensureBetterAuthSchema } from "@/lib/better-auth"
import { resolveSqliteFilePath } from "@/lib/db-resolver"
import { getSiteBaseURL } from "@/lib/site-url"

export function openSqliteFromUrl(dbUrl: string): Database.Database {
  return new Database(resolveSqliteFilePath(dbUrl))
}

function tableColumns(db: Database.Database, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info("${table}")`).all() as { name: string }[]
  return new Set(rows.map((r) => r.name))
}

/**
 * Mark user as admin + email verified (Better Auth admin plugin + login requirements).
 */
export function promoteUserToAdminSqlite(db: Database.Database, userId: string): void {
  const cols = tableColumns(db, "user")

  const evCol = cols.has("emailVerified")
    ? "emailVerified"
    : cols.has("email_verified")
      ? "email_verified"
      : null
  if (evCol) {
    db.prepare(`UPDATE "user" SET "${evCol}" = 1 WHERE id = ?`).run(userId)
  }

  if (cols.has("role")) {
    db.prepare(`UPDATE "user" SET role = ? WHERE id = ?`).run("admin", userId)
  } else {
    try {
      db.exec(`ALTER TABLE "user" ADD COLUMN role TEXT`)
      db.prepare(`UPDATE "user" SET role = ? WHERE id = ?`).run("admin", userId)
    } catch {
      // Column may already exist from a concurrent migration
    }
  }

  if (cols.has("data")) {
    try {
      db.prepare(
        `UPDATE "user" SET data = json_set(COALESCE(data, '{}'), '$.role', 'admin') WHERE id = ?`
      ).run(userId)
    } catch {
      /* optional */
    }
  }
}

type SignUpResult = { token: null | string; user: { id: string } }

/**
 * First-time admin creation when the app uses SQLite (local default).
 */
export async function runSqliteAdminSetup(params: {
  email: string
  password: string
  name: string
  dbUrl: string
}): Promise<{ success: true; user: Record<string, unknown> } | { error: string; status: number; details?: string }> {
  const { email, password, name, dbUrl } = params

  await ensureBetterAuthSchema()

  const db = openSqliteFromUrl(dbUrl)

  try {
    const baseURL = getSiteBaseURL()
    const signUpURL = `${baseURL}/api/auth/sign-up/email`

    const response = await fetch(signUpURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password,
        name,
      }),
    })

    let userId: string | null = null

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>
      const existing = db
        .prepare(`SELECT id FROM "user" WHERE email = ?`)
        .get(email.toLowerCase()) as { id: string } | undefined

      if (existing?.id) {
        userId = existing.id
      } else {
        return {
          error:
            (typeof errorData.message === "string" && errorData.message) ||
            `Sign-up failed (${response.status})`,
          status: response.status >= 400 && response.status < 600 ? response.status : 500,
          details: JSON.stringify(errorData),
        }
      }
    } else {
      const result = (await response.json()) as SignUpResult
      userId = result.user?.id ?? null
      if (!userId) {
        return { error: "User created but ID not found in response.", status: 500 }
      }
    }

    if (!userId) {
      return { error: "Could not determine user ID.", status: 500 }
    }

    promoteUserToAdminSqlite(db, userId)

    const row = db.prepare(`SELECT * FROM "user" WHERE id = ?`).get(userId) as Record<
      string,
      unknown
    >

    return { success: true, user: row ?? { id: userId } }
  } finally {
    db.close()
  }
}
