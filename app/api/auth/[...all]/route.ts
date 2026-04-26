import { getAuth, DEV_SECRET_FALLBACK, ensureBetterAuthSchema } from "@/lib/better-auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest } from "next/server"

/** Lazy: bind handler after env is available at runtime — not at import time. */
let _handlers: ReturnType<typeof toNextJsHandler> | null = null
function getAuthHandlers() {
  if (!_handlers) {
    _handlers = toNextJsHandler(getAuth().handler)
  }
  return _handlers
}

// Explicit allowlist — never reflect an arbitrary Origin with credentials.
const ALLOWED_ORIGINS = new Set(
  [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    'https://eaa690.org',
    'https://eaa-960-redesign.vercel.app',
    'http://localhost:3000',
    'http://localhost:3333',
  ].filter(Boolean) as string[]
)

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }
  return new Response(null, { status: 200 })
}

function validateSecret() {
  const isProd =
    Boolean(process.env.VERCEL_URL) || process.env.NODE_ENV === 'production'
  if (!isProd) return

  const s = process.env.BETTER_AUTH_SECRET?.trim()
  const insecure =
    !s ||
    s.length < 32 ||
    s === DEV_SECRET_FALLBACK ||
    s === 'dev-secret-change-in-production'

  if (insecure) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set in production and be at least 32 characters. ' +
        'Generate one using: openssl rand -base64 32'
    )
  }
}

async function handleWithError(
  request: NextRequest,
  method: 'GET' | 'POST'
) {
  const url = new URL(request.url)
  try {
    validateSecret()

    // Initialise Better Auth handler inside the try block so any synchronous
    // throw from betterAuth() / toNextJsHandler() is caught and logged.
    const handlers = getAuthHandlers()
    const handler = handlers[method]

    await ensureBetterAuthSchema()

    const response = await handler(request)

    if (response.status >= 400) {
      console.error(`Auth ${response.status}:`, {
        path: url.pathname,
        method,
      })
    }

    return response
  } catch (error) {
    // Log full details server-side only — never send stack/internals to the client.
    console.error('Better Auth error:', {
      path: url.pathname,
      method,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
      secret_length: process.env.BETTER_AUTH_SECRET?.length ?? 0,
      has_db_url: Boolean(
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL
      ),
      better_auth_url: process.env.BETTER_AUTH_URL ?? '(not set)',
    })

    // In development, surface more detail so the local dev experience isn't painful.
    const isDev = process.env.NODE_ENV === 'development'
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        ...(isDev && {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        }),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleWithError(request, 'GET')
}

export async function POST(request: NextRequest) {
  return handleWithError(request, 'POST')
}
