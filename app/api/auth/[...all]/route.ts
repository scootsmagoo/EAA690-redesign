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

// Wrap handlers with error handling
async function handleWithError(
  handler: (request: NextRequest) => Promise<Response>,
  request: NextRequest
) {
  try {
    return await handler(request)
  } catch (error) {
    console.error("Better Auth API Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log full error details for debugging
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      url: request.url,
      method: request.method,
    })
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
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

