import { betterAuth } from "better-auth"
import { twoFactor, admin } from "better-auth/plugins"
import { Pool } from "pg"

// Lazy initialization of database connection to avoid build-time errors
let _pool: Pool | null = null

function getPool(): Pool | null {
  if (_pool) return _pool
  
  if (process.env.DATABASE_URL) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") 
        ? false 
        : { rejectUnauthorized: false },
    })
  }
  
  return _pool
}

// Determine the base URL for authentication
// Priority: explicit env var > Vercel URL > localhost
function getBaseURL(): string {
  // If explicitly set, use that
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL
  }
  
  // For Vercel deployments, use the deployment URL
  // VERCEL_URL is available server-side (no NEXT_PUBLIC_ prefix needed)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Fallback for local development
  return "http://localhost:3000"
}

// BetterAuth configuration with MFA
// Note: database may be undefined during build, but that's okay
// The actual database operations happen at runtime
export const auth = betterAuth({
  database: getPool() || undefined,
  baseURL: getBaseURL(),
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disabled for now - can enable when email is configured
  },
  plugins: [
    twoFactor(),
    admin(),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
})

export type Session = typeof auth.$Infer.Session

