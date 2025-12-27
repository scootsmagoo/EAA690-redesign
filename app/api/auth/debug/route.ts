import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'

/**
 * Debug route to check Better Auth configuration
 * This helps diagnose 403 errors
 */
export async function GET(request: NextRequest) {
  try {
    // Get the actual request URL
    const url = new URL(request.url)
    const origin = request.headers.get('origin') || url.origin
    
    // Determine what baseURL Better Auth is using
    const baseURL = process.env.BETTER_AUTH_URL 
      || process.env.NEXT_PUBLIC_BETTER_AUTH_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    return NextResponse.json({
      success: true,
      debug: {
        requestOrigin: origin,
        requestUrl: url.href,
        betterAuthBaseURL: baseURL,
        betterAuthBasePath: '/api/auth',
        expectedAuthURL: `${baseURL}/api/auth`,
        environment: {
          BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'not set',
          NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'not set',
          VERCEL_URL: process.env.VERCEL_URL || 'not set',
          NODE_ENV: process.env.NODE_ENV || 'not set',
        },
        database: {
          DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
        },
        secret: {
          BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'set' : 'not set',
        },
      },
      recommendation: baseURL !== origin 
        ? `⚠️ BaseURL mismatch! Better Auth baseURL (${baseURL}) doesn't match request origin (${origin}). This can cause 403 errors. Set BETTER_AUTH_URL=${origin} in Vercel.`
        : '✅ BaseURL matches request origin',
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to get debug info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

