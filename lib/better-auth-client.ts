"use client"

import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

/** Must match `basePath` in `lib/better-auth.ts` (server). */
const AUTH_BASE_PATH = "/api/auth"

/**
 * Origin only (no path). Client must call `/api/auth/*` on the same origin as the page
 * (e.g. http://localhost:3000 vs http://192.168.x.x:3000) or Better Auth CSRF checks fail on sign-in.
 */
function getAuthOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  const fromEnv = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim()
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin
    } catch {
      /* fall through */
    }
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  return "http://localhost:3000"
}

export const authClient = createAuthClient({
  baseURL: getAuthOrigin(),
  basePath: AUTH_BASE_PATH,
  plugins: [adminClient()],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  admin,
} = authClient

