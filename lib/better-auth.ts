import { betterAuth } from "better-auth"
import { twoFactor, admin } from "better-auth/plugins"
import { Pool } from "pg"
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from "./db-resolver"
import { getSiteBaseURL } from "./site-url"

// Lazy initialization — Postgres
let _pool: Pool | null = null

function getPool(): Pool | null {
  if (_pool) return _pool

  const url = getEffectiveDatabaseUrl()
  if (!url || !isPostgresUrl(url)) return null

  try {
    console.log("Creating database pool:", {
      hasUrl: true,
      urlPrefix: url.substring(0, 30) + "...",
      isLocalhost: url.includes("localhost"),
    })

    _pool = new Pool({
      connectionString: url,
      ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      max: 1,
    })

    _pool.on("error", (err) => {
      console.error("Unexpected database pool error:", {
        message: err.message,
        code: (err as { code?: string })?.code,
        detail: (err as { detail?: string })?.detail,
      })
    })
  } catch (error) {
    console.error("Failed to create database pool:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as { code?: string })?.code,
    })
    _pool = null
  }

  return _pool
}

// Lazy SQLite — require() only when needed so Vercel (Postgres-only) never loads the native addon.
let _sqlite: import("better-sqlite3").Database | null = null

function getSqlite(): import("better-sqlite3").Database | null {
  if (_sqlite) return _sqlite

  const url = getEffectiveDatabaseUrl()
  if (!url || isPostgresUrl(url)) return null

  try {
    const Database = require("better-sqlite3") as typeof import("better-sqlite3")
    const filePath = resolveSqliteFilePath(url)
    console.log("Opening SQLite for Better Auth:", { path: filePath })
    _sqlite = new Database(filePath)
    return _sqlite
  } catch (error) {
    console.error("Failed to open SQLite database:", error)
    return null
  }
}

function getAuthDatabase(): Pool | import("better-sqlite3").Database | undefined {
  const url = getEffectiveDatabaseUrl()
  if (!url) {
    console.warn(
      "DATABASE_URL is not set (production). Better Auth will run without a database."
    )
    return undefined
  }
  if (isPostgresUrl(url)) {
    return getPool() || undefined
  }
  return getSqlite() || undefined
}

/**
 * Development-only fallback when `BETTER_AUTH_SECRET` is unset.
 * Better Auth requires the secret to be at least 32 characters (the old
 * `dev-secret-change-in-production` string was too short and broke login).
 */
export const DEV_SECRET_FALLBACK =
  "eaa690-local-development-only-not-for-production-use"

function getSecret(): string {
  const fromEnv = process.env.BETTER_AUTH_SECRET?.trim()
  if (fromEnv) {
    if (fromEnv.length < 32) {
      throw new Error(
        "Invalid BETTER_AUTH_SECRET: must be at least 32 characters long for adequate security. " +
          "Generate one with `npx @better-auth/cli secret` or `openssl rand -base64 32`."
      )
    }
    return fromEnv
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "⚠️  BETTER_AUTH_SECRET not set. Using DEV_SECRET_FALLBACK for development only."
    )
  }

  return DEV_SECRET_FALLBACK
}

/**
 * Lazy singleton — must be created at request time (not at module load).
 * During `next build` / static analysis, `DATABASE_URL` is often unset; initializing
 * `betterAuth` at import time would bind `database: undefined` forever on Vercel.
 */
let _auth: ReturnType<typeof betterAuth> | null = null

export function getAuth(): NonNullable<typeof _auth> {
  if (!_auth) {
    _auth = betterAuth({
      database: getAuthDatabase(),
      baseURL: getSiteBaseURL(),
      basePath: "/api/auth",
      secret: getSecret(),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      plugins: [twoFactor(), admin()],
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
    })
  }
  return _auth
}

export type Session = ReturnType<typeof getAuth>["$Infer"]["Session"]

let schemaReady: Promise<void> | null = null

/**
 * Creates Better Auth tables (user, session, etc.) if missing.
 * Required for fresh SQLite/Postgres databases — without this, sign-up returns "no such table: user".
 */
export async function ensureBetterAuthSchema(): Promise<void> {
  if (!getAuthDatabase()) return
  if (!schemaReady) {
    schemaReady = (async () => {
      const ctx = await getAuth().$context
      await ctx.runMigrations()
    })().catch((err) => {
      schemaReady = null
      throw err
    })
  }
  await schemaReady
}
