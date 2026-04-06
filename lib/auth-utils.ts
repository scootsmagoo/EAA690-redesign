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

export type UserRole = "admin" | "editor" | "user"

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

/** Check if the current user has a specific role (exact match). */
export function useHasRole(role: UserRole): boolean {
  const { data: session } = useSession()
  return getRole(session) === role
}

/** Server-side helper: true only for admins. */
export async function isAdmin(session: any): Promise<boolean> {
  if (!session?.user) return false
  return getRole(session) === "admin"
}

/** Server-side helper: true for admins and editors. */
export async function canAccessStudio(session: any): Promise<boolean> {
  if (!session?.user) return false
  const role = getRole(session)
  return role === "admin" || role === "editor"
}
