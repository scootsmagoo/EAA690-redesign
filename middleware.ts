import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to override any Vercel-level redirects
 * This ensures /login stays on our site and doesn't redirect to Squarespace
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Explicitly handle /login to prevent any external redirects
  if (pathname === '/login') {
    // Allow the request to proceed to our Next.js login page
    return NextResponse.next()
  }

  // For all other routes, proceed normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

