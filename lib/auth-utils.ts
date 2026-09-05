/**
 * Authentication utility functions
 * Helper functions for checking user roles and permissions
 *
 * Role hierarchy:
 *   admin  → full access (admin dashboard + Sanity studio)
 *   editor → Sanity studio only (no admin dashboard)
 *   user   → regular member access
 */

import { useSession } from "@/lib/better-auth-client"

function getRole(session: any): string | undefined {
  return (session?.user as any)?.role || (session?.user as any)?.data?.role
}

/** True only for site admins. */
export function useIsAdmin(): boolean {
  const { data: session } = useSession()
  return getRole(session) === "admin"
}

/** True for editors (but not admins — use useCanAccessStudio() for studio access). */
export function useIsEditor(): boolean {
  const { data: session } = useSession()
  return getRole(session) === "editor"
}

/** True for any role that should be allowed into the Sanity Studio. */
export function useCanAccessStudio(): boolean {
  const { data: session } = useSession()
  const role = getRole(session)
  return role === "admin" || role === "editor"
}
