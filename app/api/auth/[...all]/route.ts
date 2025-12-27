import { auth } from "@/lib/better-auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest } from "next/server"

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth.handler)

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

// Validate that BETTER_AUTH_SECRET is set at runtime
function validateSecret() {
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET === 'dev-secret-change-in-production') {
    if (process.env.VERCEL_URL || process.env.NODE_ENV === 'production') {
      throw new Error(
        'BETTER_AUTH_SECRET environment variable is required in production. ' +
        'Generate one using: openssl rand -base64 32'
      )
    }
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
    
    // Log request for debugging
    const url = new URL(request.url)
    console.log("Better Auth request:", {
      path: url.pathname,
      method: request.method,
      hasDatabase: !!process.env.DATABASE_URL,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log full error details for debugging
    const url = new URL(request.url)
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      url: request.url,
      path: url.pathname,
      method: request.method,
      hasDatabase: !!process.env.DATABASE_URL,
      hasSecret: !!process.env.BETTER_AUTH_SECRET,
      errorType: error?.constructor?.name,
    })
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
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
  return handleWithError(authGET, request)
}

export async function POST(request: NextRequest) {
  return handleWithError(authPOST, request)
}
