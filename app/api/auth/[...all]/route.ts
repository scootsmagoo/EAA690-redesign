import { getAuth, DEV_SECRET_FALLBACK, ensureBetterAuthSchema } from "@/lib/better-auth"
import { getEffectiveDatabaseUrl } from "@/lib/db-resolver"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest } from "next/server"

/** Lazy: bind handler after env (DATABASE_URL, secrets) is available at runtime — not at import time. */
let _handlers: ReturnType<typeof toNextJsHandler> | null = null
function getAuthHandlers() {
  if (!_handlers) {
    _handlers = toNextJsHandler(getAuth().handler)
  }
  return _handlers
}

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin")
  
  // Allow same-origin and Vercel preview deployments
  if (origin) {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }
  
  return new Response(null, { status: 200 })
}

// Validate that BETTER_AUTH_SECRET is set at runtime (production / Vercel)
function validateSecret() {
  const isProd =
    Boolean(process.env.VERCEL_URL) || process.env.NODE_ENV === "production"
  if (!isProd) return

  const s = process.env.BETTER_AUTH_SECRET?.trim()
  const insecure =
    !s ||
    s.length < 32 ||
    s === DEV_SECRET_FALLBACK ||
    s === "dev-secret-change-in-production"

  if (insecure) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set in production and be at least 32 characters. " +
        "Generate one using: openssl rand -base64 32"
    )
  }
}

// Wrap handlers with error handling
async function handleWithError(
  handler: (request: NextRequest) => Promise<Response>,
  request: NextRequest
) {
  try {
    // Validate secret at runtime (not during build)
    validateSecret()

    await ensureBetterAuthSchema()
    
    // Log request for debugging
    const url = new URL(request.url)
    const dbUrl = getEffectiveDatabaseUrl()
    console.log("Better Auth request:", {
      path: url.pathname,
      method: request.method,
      hasDatabase: !!dbUrl,
      databaseUrlPrefix: dbUrl ? dbUrl.substring(0, 50) + '...' : 'not set',
      hasSecret: !!process.env.BETTER_AUTH_SECRET,
    })
    
    const response = await handler(request)
    
    // Log errors for debugging
    if (response.status >= 400) {
      console.error(`${response.status} error:`, {
        path: url.pathname,
        method: request.method,
        url: request.url,
      })
      
      // Try to get the response body for more details
      try {
        const clonedResponse = response.clone()
        const body = await clonedResponse.text()
        console.error(`${response.status} Response body:`, body)
      } catch (e) {
        // Ignore if we can't read the body
      }
    }
    
    return response
  } catch (error) {
    console.error("Better Auth API Error:", error)
    let errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorCode = (error as any)?.code
    const errorDetail = (error as any)?.detail

    const dbHint =
      /tenant or user not found|password authentication failed|could not translate host/i.test(
        errorMessage
      )
        ? " Check DATABASE_URL / POSTGRES_URL in Vercel: use the exact connection string from your host (Neon, Supabase, Vercel Postgres). Supabase user is often postgres.<project-ref>."
        : ""
    if (dbHint) errorMessage = errorMessage + dbHint
    
    // Log full error details for debugging
    const url = new URL(request.url)
    const dbUrl = getEffectiveDatabaseUrl()
    console.error("Error details:", {
      message: errorMessage,
      code: errorCode,
      detail: errorDetail,
      stack: errorStack,
      url: request.url,
      path: url.pathname,
      method: request.method,
      hasDatabase: !!dbUrl,
      databaseUrlPrefix: dbUrl ? dbUrl.substring(0, 50) + '...' : 'not set',
      hasSecret: !!process.env.BETTER_AUTH_SECRET,
      errorType: error?.constructor?.name,
    })
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
        code: errorCode,
        detail: errorDetail,
        path: url.pathname,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}

export async function GET(request: NextRequest) {
  const { GET: authGET } = getAuthHandlers()
  return handleWithError(authGET, request)
}

export async function POST(request: NextRequest) {
  const { POST: authPOST } = getAuthHandlers()
  return handleWithError(authPOST, request)
}
