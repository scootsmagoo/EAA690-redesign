'use client'

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useSession } from '@/lib/better-auth-client'
import Link from 'next/link'

function AccountPageInner() {
  const { data: session } = useSession()
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Failed to open portal')
      window.location.href = data.url
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Something went wrong.')
      setPortalLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-eaa-blue mb-8">Account Settings</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Profile Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Name</dt>
              <dd className="text-gray-900">{session?.user?.name || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Email</dt>
              <dd className="text-gray-900">{session?.user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Account Created</dt>
              <dd className="text-gray-900">
                {session?.user?.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString()
                  : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Security</h2>
          <Link
            href="/account/change-password"
            className="text-eaa-blue hover:text-eaa-light-blue font-medium"
          >
            Change Password →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-1">Membership</h2>
          <p className="text-sm text-gray-500 mb-4">
            Manage your chapter membership billing, cancel or update your subscription, and download
            receipts.
          </p>
          {portalError && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-4">
              {portalError}
            </p>
          )}
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            aria-busy={portalLoading}
            aria-label={portalLoading ? 'Opening billing portal, please wait' : 'Manage your subscription'}
            className="bg-eaa-blue text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {portalLoading ? 'Opening…' : 'Manage Subscription →'}
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Not yet a member?{' '}
            <Link href="/join" className="text-eaa-light-blue hover:underline font-medium">
              View membership options
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-1">Display &amp; accessibility</h2>
          <p className="text-sm text-gray-500 mb-4">
            Theme (light / dark / system), text size, reduced motion, high-contrast mode, and link
            underlines. These settings sync across the devices you sign in on.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-eaa-blue hover:text-eaa-light-blue font-medium"
          >
            Open preferences →
          </Link>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-eaa-blue mb-2">Need Help?</h3>
          <p className="text-gray-700 mb-4">
            If you need assistance with your account, please contact the chapter administrator.
          </p>
          <Link href="/contact" className="text-eaa-blue hover:text-eaa-light-blue font-medium">
            Contact Us →
          </Link>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function AccountPage() {
  return <AccountPageInner />
}
