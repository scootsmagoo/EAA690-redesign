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
  const [approval, setApproval] = useState<{
    checked: boolean
    loading: boolean
    approved: boolean
    status: 'pending' | 'approved' | 'rejected'
    rejectedReason: string | null
    error: string
  }>({
    checked: false,
    loading: false,
    approved: false,
    status: 'pending',
    rejectedReason: null,
    error: '',
  })

  useEffect(() => {
    if (!isPending) {
      setStalled(false)
      return
    }
    const t = window.setTimeout(() => setStalled(true), SESSION_STALL_MS)
    return () => window.clearTimeout(t)
  }, [isPending])

  useEffect(() => {
    if (!requireAuth || !session?.user) {
      setApproval({
        checked: false,
        loading: false,
        approved: false,
        status: 'pending',
        rejectedReason: null,
        error: '',
      })
      return
    }

    let cancelled = false
    setApproval((prev) => ({ ...prev, checked: false, loading: true, error: '' }))
    fetch('/api/me/approval', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to check account approval')
        return data as {
          approved: boolean
          approvalStatus: 'pending' | 'approved' | 'rejected'
          rejectedReason: string | null
        }
      })
      .then((data) => {
        if (cancelled) return
        setApproval({
          checked: true,
          loading: false,
          approved: data.approved,
          status: data.approvalStatus,
          rejectedReason: data.rejectedReason,
          error: '',
        })
      })
      .catch((err) => {
        if (cancelled) return
        setApproval({
          checked: true,
          loading: false,
          approved: false,
          status: 'pending',
          rejectedReason: null,
          error: err instanceof Error ? err.message : 'Failed to check account approval',
        })
      })

    return () => {
      cancelled = true
    }
  }, [requireAuth, session?.user?.id])

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

  if (requireAuth && session && (!approval.checked || approval.loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eaa-blue mx-auto mb-4"></div>
          <p className="text-gray-600" role="status" aria-live="polite">Checking account approval…</p>
        </div>
      </div>
    )
  }

  if (requireAuth && session && !approval.approved) {
    const rejected = approval.status === 'rejected'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-eaa-blue mb-3">
            {rejected ? 'Account access not approved' : 'Account pending approval'}
          </h1>
          <p className="text-gray-600 mb-4">
            {rejected
              ? 'An admin reviewed this registration and did not approve member-only website access.'
              : 'Thanks for registering. An EAA 690 admin needs to confirm your membership before this area is available.'}
          </p>
          {approval.rejectedReason && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-md p-3 mb-4">
              {approval.rejectedReason}
            </p>
          )}
          {approval.error && (
            <p className="text-sm text-red-700 bg-red-50 rounded-md p-3 mb-4">
              {approval.error}
            </p>
          )}
          <button
            onClick={() => router.push('/contact')}
            className="px-4 py-2 bg-eaa-blue text-white rounded-md hover:bg-eaa-light-blue"
          >
            Contact EAA 690
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
