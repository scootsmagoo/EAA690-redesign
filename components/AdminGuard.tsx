'use client'

import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/better-auth-client'
import { useIsAdmin } from '@/lib/auth-utils'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { data: session, isPending } = useSession()
  const isAdmin = useIsAdmin()
  const router = useRouter()

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eaa-blue mx-auto mb-4"></div>
          <p className="text-gray-600" role="status" aria-live="polite">Checking permissions…</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, redirect to login
  if (!session) {
    router.push('/sign-in?redirect=' + encodeURIComponent(window.location.pathname))
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eaa-blue mx-auto mb-4"></div>
          <p className="text-gray-600" role="status" aria-live="polite">Redirecting to login…</p>
        </div>
      </div>
    )
  }

  // If user is not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-eaa-blue text-white rounded-md hover:bg-eaa-light-blue"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

