import path from "path"

/**
 * Resolves which database Better Auth should use.
 * - If `DATABASE_URL` is unset in development, defaults to SQLite at `./eaa-auth.db`
 *   (no hosted Postgres required for local work).
 * - In production, prefer `DATABASE_URL`, then common Vercel / Prisma fallbacks (many teams
 *   only set `POSTGRES_URL` from the Vercel Postgres integration).
 */
export function getEffectiveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.PRISMA_DATABASE_URL,
  ]
  for (const c of candidates) {
    const v = c?.trim()
    if (v) return v
  }
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
