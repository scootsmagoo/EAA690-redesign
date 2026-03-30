import path from "path"

/**
 * Resolves which database Better Auth should use.
 * - If `DATABASE_URL` is unset in development, defaults to SQLite at `./eaa-auth.db`
 *   (no hosted Postgres required for local work).
 * - In production, `DATABASE_URL` must be set explicitly (Postgres on Vercel, etc.).
 */
export function getEffectiveDatabaseUrl(): string | undefined {
  const v = process.env.DATABASE_URL?.trim()
  if (v) return v
  if (process.env.NODE_ENV !== "production") {
    return "./eaa-auth.db"
  }
  return undefined
}

export function isPostgresUrl(url: string): boolean {
  return url.startsWith("postgres://") || url.startsWith("postgresql://")
}

/** Map env / relative path to an absolute filesystem path for SQLite. */
export function resolveSqliteFilePath(url: string): string {
  let p = url
  if (p.startsWith("file:")) {
    p = p.slice(5)
  }
  if (p.startsWith("./") || p.startsWith(".\\")) {
    return path.join(process.cwd(), p)
  }
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p)
}
