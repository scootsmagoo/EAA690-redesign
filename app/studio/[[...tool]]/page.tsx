'use client'

import { NextStudio } from 'next-sanity/studio'
import { useSession } from '@/lib/better-auth-client'
import { useCanAccessStudio } from '@/lib/auth-utils'
import { useRouter } from 'next/navigation'
import config from '@/sanity.config'

export const dynamic = 'force-dynamic'

export default function StudioPage() {
  const { data: session, isPending } = useSession()
  const canAccess = useCanAccessStudio()
  const router = useRouter()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white text-sm">Checking permissions…</p>
      </div>
    )
  }

  if (!session) {
    router.replace('/sign-in?redirect=/studio')
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white text-sm">Redirecting to login…</p>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-3">Access Denied</h1>
          <p className="text-gray-400 mb-6">Editor or Admin access is required to use the content studio.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 text-sm font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return <NextStudio config={config} />
}
