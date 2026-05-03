/**
 * @deprecated This file is deprecated. Use BetterAuth instead.
 * 
 * This module was used for Squarespace authentication but has been replaced
 * with BetterAuth for better security and more features.
 * 
 * See: lib/better-auth.ts and lib/better-auth-client.ts
 * 
 * This file is kept for reference during migration but should not be used in new code.
 */

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Squarespace sets various cookies when a user is logged in
  // Common cookies include: ss_sq, ss_cid, ss_cvr, etc.
  // The most reliable way is to check for the presence of Squarespace session cookies
  const cookies = document.cookie.split(';')
  
  // Check for Squarespace authentication cookies
  // Squarespace uses various cookie names:
  // - ss_sq (session)
  // - ss_cid (client ID) 
  // - ss_cvr (visitor record)
  // - ss_cvt (visitor type)
  // - ss_cpvisit (visit tracking)
  // - Member area specific cookies
  const squarespaceCookies = cookies.some(cookie => {
    const [name] = cookie.trim().split('=')
    return (
      name.startsWith('ss_') || 
      name.includes('squarespace') ||
      name.includes('sqsp') ||
      name === 'crumb' // Squarespace CSRF token
    )
  })

  // Also check if there's a member session cookie
  const hasMemberSession = cookies.some(cookie => {
    const [name] = cookie.trim().split('=')
    return name.includes('member') || name.includes('account') || name.includes('auth')
  })

  // Check for authenticated user indicator
  // Squarespace may set a cookie indicating logged-in status
  const hasAuthCookie = cookies.some(cookie => {
    const [name, value] = cookie.trim().split('=')
    return (
      (name.includes('authenticated') || name.includes('logged_in')) &&
      value === 'true'
    )
  })

  return squarespaceCookies || hasMemberSession || hasAuthCookie
}

export function getLoginUrl(redirectTo?: string): string {
  const baseUrl = 'https://www.eaa690.org/account/login'
  const returnUrl = redirectTo 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${redirectTo}`
    : typeof window !== 'undefined' 
      ? window.location.href 
      : '/'
  
  return `${baseUrl}?noredirect=true&returnUrl=${encodeURIComponent(returnUrl)}`
}

export function getLogoutUrl(): string {
  return 'https://www.eaa690.org/account/logout'
}

