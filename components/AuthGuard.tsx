'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/better-auth-client'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

/** If session never resolves (stale chunk cache, API hang), avoid an infinite spinner. */
const SESSION_STALL_MS = 15000

export default function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [stalled, setStalled] = useState(false)

  useEffect(() => {
    if (!isPending) {
      setStalled(false)
      return
    }
    const t = window.setTimeout(() => setStalled(true), SESSION_STALL_MS)
    return () => window.clearTimeout(t)
  }, [isPending])

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eaa-blue mx-auto mb-4"></div>
          <p className="text-gray-600" role="status" aria-live="polite">Checking authentication…</p>
          {stalled && (
            <p className="mt-4 text-sm text-gray-500">
              This is taking longer than expected. Try a hard refresh (Ctrl+Shift+R) or stop and restart{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">npm run dev</code> and clear the{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">.next</code> folder if the problem
              persists.
            </p>
          )}
        </div>
      </div>
    )
  }

  // If auth is required but user is not authenticated, redirect to login
  if (requireAuth && !session) {
    router.push('/sign-in')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eaa-blue mx-auto mb-4"></div>
          <p className="text-gray-600" role="status" aria-live="polite">Redirecting to login…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
