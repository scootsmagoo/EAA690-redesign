/**
 * User-facing message for a failed Better Auth client call.
 *
 * A 5xx (or a network failure, which the client reports without a status) is OUR
 * outage, not the member's typo. During the Sept 2026 auth outages the sign-in
 * form answered every attempt with "Invalid email or password", which sent
 * people off resetting perfectly good passwords — so say plainly when the fault
 * is on our side and keep credential wording for real 4xx rejections.
 */
export const AUTH_UNAVAILABLE_MESSAGE =
  'Sign-in is temporarily unavailable because of a problem on our end — your password is fine. Please try again in a few minutes.'

type AuthClientError = { status?: number; message?: string } | null | undefined

export function authErrorMessage(error: AuthClientError, fallback: string): string {
  const status = error?.status
  if (typeof status === 'number' && (status >= 500 || status === 0)) {
    return AUTH_UNAVAILABLE_MESSAGE
  }
  return error?.message || fallback
}
