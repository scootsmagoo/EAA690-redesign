'use client'

import { useEffect, useState } from 'react'
import AdminGuard from '@/components/AdminGuard'
import Link from 'next/link'

interface Charge {
  id: string
  amount: number
  currency: string
  status: string
  description: string | null
  created: number
  customerEmail: string | null
  receiptUrl: string | null
  metadata: Record<string, string>
}

interface ActiveSubscription {
  id: string
  status: string
  billingCycleAnchor: number
  cancelAt: number | null
  cancelAtPeriodEnd: boolean
  customerEmail: string | null
  items: {
    priceId: string
    amount: number | null
    interval: string | undefined
  }[]
}

interface PaymentData {
  charges: Charge[]
  hasMore: boolean
  activeSubscriptions: ActiveSubscription[]
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_STYLES: Record<string, string> = {
  succeeded: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-gray-100 text-gray-700',
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/payments')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-eaa-blue mb-1">Payments</h1>
            <p className="text-gray-500 text-sm">Live data from Stripe — test mode keys show test transactions.</p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-eaa-blue hover:underline"
          >
            ← Admin Dashboard
          </Link>
        </div>

        {loading && (
          <div role="status" aria-live="polite" className="text-center py-16 text-gray-500">
            Loading payment data…
          </div>
        )}

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            <p className="font-semibold mb-1">Could not load payment data</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-red-500">
              Make sure <code>STRIPE_SECRET_KEY</code> is set in your environment variables.
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Active Subscriptions */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-eaa-blue mb-4">
                Active Subscriptions
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({data.activeSubscriptions.length})
                </span>
              </h2>
              {data.activeSubscriptions.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No active subscriptions found.</p>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Plan</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Renews</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Stripe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.activeSubscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">{sub.customerEmail ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                            {sub.items[0]?.interval ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium">
                            {sub.items[0]?.amount != null
                              ? formatAmount(sub.items[0].amount, 'usd')
                              : '—'}
                            {sub.items[0]?.interval ? `/${sub.items[0].interval}` : ''}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {sub.cancelAt
                              ? formatDate(sub.cancelAt)
                              : formatDate(sub.billingCycleAnchor)}
                            {sub.cancelAtPeriodEnd && (
                              <span className="ml-1 text-xs text-orange-600">(cancels)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[sub.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`https://dashboard.stripe.com/subscriptions/${sub.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View subscription for ${sub.customerEmail ?? sub.id} in Stripe Dashboard (opens new tab)`}
                              className="text-eaa-light-blue hover:underline text-xs"
                            >
                              View ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Recent Charges */}
            <section>
              <h2 className="text-xl font-bold text-eaa-blue mb-4">
                Recent Charges
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({data.charges.length}{data.hasMore ? '+' : ''})
                </span>
              </h2>
              {data.charges.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No charges found.</p>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.charges.map((charge) => (
                        <tr key={charge.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {formatDate(charge.created)}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{charge.customerEmail ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500 capitalize">
                            {charge.metadata?.type ?? '—'}
                            {charge.metadata?.tier ? ` (${charge.metadata.tier})` : ''}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {formatAmount(charge.amount, charge.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[charge.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {charge.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {charge.receiptUrl ? (
                              <a
                                href={charge.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`View receipt for charge on ${formatDate(charge.created)} (opens new tab)`}
                                className="text-eaa-light-blue hover:underline text-xs"
                              >
                                Receipt ↗
                              </a>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminGuard>
  )
}
