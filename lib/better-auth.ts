import { betterAuth } from "better-auth"
import { twoFactor, admin } from "better-auth/plugins"
import { Pool } from "pg"
import { getEffectiveDatabaseUrl, isPostgresUrl, resolveSqliteFilePath } from "./db-resolver"
import { getSiteBaseURL } from "./site-url"
import { relaxTwoFactorPlugin } from "./better-auth-plugins/relax-two-factor"
import { sendPasswordResetEmail } from "./password-reset-email"

// Lazy initialization — Postgres
let _pool: Pool | null = null

function getPool(): Pool | null {
  if (_pool) return _pool

  const url = getEffectiveDatabaseUrl()
  if (!url || !isPostgresUrl(url)) return null

  try {
    console.log("Creating database pool:", {
      isLocalhost: url.includes("localhost"),
    })

    _pool = new Pool({
      connectionString: url,
      // rejectUnauthorized: false is required for hosted Postgres providers (e.g. Supabase) whose
      // SSL termination proxies use self-signed or intermediate certs. The connection is still
      // encrypted; the client just doesn't verify the server certificate.
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

const PRODUCTION_TRUSTED_ORIGINS = [
  "https://eaa690.org",
  "https://www.eaa690.org",
  "https://eaa-960-redesign.vercel.app",
] as const

function isLanHttpOrigin(origin: string): boolean {
  try {
    const u = new URL(origin)
    if (u.protocol !== "http:" && u.protocol !== "https:") return false
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true
    const p = u.hostname.split(".")
    if (p.length === 4 && p[0] === "192" && p[1] === "168") return true
    if (p.length === 4 && p[0] === "10") return true
    if (p.length === 4 && p[0] === "172" && Number(p[1]) >= 16 && Number(p[1]) <= 31) return true
    return false
  } catch {
    return false
  }
}

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
        /**
         * Triggered by `authClient.requestPasswordReset({ email, redirectTo })`. Better Auth has
         * already generated the one-time token and built `url` to point at our `/reset-password`
         * page; we just hand it to Resend. We log+swallow delivery errors so we never leak whether
         * the email exists in our DB (Better Auth itself always returns success to the client for
         * the same enumeration-resistance reason — see request-password-reset.mjs).
         */
        sendResetPassword: async ({ user, url }) => {
          try {
            await sendPasswordResetEmail({
              to: user.email,
              name: (user as { name?: string | null }).name ?? null,
              resetUrl: url,
            })
          } catch (err) {
            console.error("sendResetPassword failed:", {
              email: user.email,
              error: err instanceof Error ? err.message : String(err),
            })
          }
        },
        resetPasswordTokenExpiresIn: 60 * 60,
        /**
         * OWASP A07 (Auth Failures): kill every active session for the user the moment their
         * password is reset. Without this, a stolen session cookie survives a "reset my password"
         * action — defeating the whole point of the reset for the lost-device / phished scenario.
         */
        revokeSessionsOnPasswordReset: true,
      },
      /**
       * Per-route rate limiting. Defaults are 100 req / 10s per IP per path which is far too lax
       * for the password-reset request endpoint — an attacker could email-bomb arbitrary inboxes
       * or our own SMTP quota. 5 requests / 60s is the OWASP cheat-sheet recommendation for this
       * kind of unauthenticated trigger-an-email endpoint. Rate limiting is auto-enabled in
       * production and disabled in development.
       */
      rateLimit: {
        customRules: {
          "/request-password-reset": { window: 60, max: 5 },
          "/reset-password": { window: 60, max: 10 },
        },
      },
      /**
       * Order matters: `relaxTwoFactorPlugin` must run before `twoFactor` so allowlisted dev emails
       * can sign in without a second factor when the DB has 2FA enabled.
       */
      plugins: [
        relaxTwoFactorPlugin(),
        twoFactor({
          issuer: "EAA Chapter 690",
        }),
        admin(),
      ],
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
      /**
       * Default trusted origin is only `new URL(baseURL).origin`. If you open the dev server via a
       * LAN IP (e.g. http://192.168.1.5:3000) while baseURL is localhost, sign-in POSTs fail CSRF.
       * In development, allow the request Origin when it looks like a local/private network URL.
       */
      trustedOrigins: async (request) => {
        const extra: string[] = [...PRODUCTION_TRUSTED_ORIGINS]
        if (process.env.NODE_ENV === "development") {
          const o = request?.headers.get("origin")
          if (o && isLanHttpOrigin(o)) extra.push(o)
        }
        return extra
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
      // "already exists" (42P07) means tables are already set up — safe to ignore
      const msg: string = err?.message ?? ""
      if (msg.includes("already exists")) {
        return
      }
      schemaReady = null
      throw err
    })
  }
  await schemaReady
}
