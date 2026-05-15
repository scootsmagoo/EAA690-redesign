'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

type RegistrationUser = {
  id: string
  name: string | null
  email: string
  role: string | null
  approvalStatus: ApprovalStatus
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  createdAt: string | null
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

const STATUS_BADGES: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-900',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

function RegistrationsInner() {
  const [users, setUsers] = useState<RegistrationUser[]>([])
  const [filter, setFilter] = useState<ApprovalStatus | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`
      const res = await fetch(`/api/admin/registrations${query}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load registrations')
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const counts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.approvalStatus] += 1
        return acc
      },
      { pending: 0, approved: 0, rejected: 0 } as Record<ApprovalStatus, number>
    )
  }, [users])

  async function updateStatus(user: RegistrationUser, status: 'approved' | 'rejected') {
    setUpdating(user.id)
    setToast('')
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status,
          reason: status === 'rejected' ? reasons[user.id] : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update registration')
      setUsers((prev) => {
        if (filter !== 'all') return prev.filter((u) => u.id !== user.id)
        return prev.map((u) => u.id === user.id ? data.user : u)
      })
      setReasons((prev) => ({ ...prev, [user.id]: '' }))
      setToast(`${user.email} ${status === 'approved' ? 'approved' : 'rejected'}.`)
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Update failed')
      setTimeout(() => setToast(''), 4000)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-eaa-light-blue hover:underline mb-2 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-eaa-blue">Registration Review</h1>
          <p className="text-gray-600 mt-1">Approve website account access for confirmed EAA 690 members.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-950">
        New signups can create credentials, but member-only pages stay locked until an admin approves
        the account here.
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              filter === status
                ? 'bg-eaa-blue text-white border-eaa-blue'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'All' : STATUS_LABELS[status]}
            {status !== 'all' && filter === 'all' ? ` (${counts[status]})` : ''}
          </button>
        ))}
      </div>

      {toast && (
        <div className="mb-4 px-4 py-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-800">
          {toast}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eaa-blue" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const isUpdating = updating === user.id
                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.name || '—'}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      {user.role && <div className="text-xs text-gray-400 mt-1">Role: {user.role}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.approvalStatus} />
                      {user.rejectionReason && (
                        <p className="text-xs text-gray-500 mt-2 max-w-xs">{user.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      <div>Joined: {formatDate(user.createdAt)}</div>
                      {user.approvedAt && <div>Approved: {formatDate(user.approvedAt)}</div>}
                      {user.rejectedAt && <div>Rejected: {formatDate(user.rejectedAt)}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {user.approvalStatus === 'pending' ? (
                        <div className="space-y-2">
                          <textarea
                            value={reasons[user.id] ?? ''}
                            onChange={(e) => setReasons((prev) => ({ ...prev, [user.id]: e.target.value }))}
                            rows={2}
                            maxLength={500}
                            placeholder="Optional rejection reason"
                            className="w-full min-w-56 text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue"
                          />
                          <div className="flex gap-2 flex-wrap">
                            <button
                              disabled={isUpdating}
                              onClick={() => updateStatus(user, 'approved')}
                              className="px-3 py-1 text-xs rounded border border-green-600 text-green-700 hover:bg-green-600 hover:text-white disabled:opacity-50"
                            >
                              {isUpdating ? '…' : 'Approve'}
                            </button>
                            <button
                              disabled={isUpdating}
                              onClick={() => updateStatus(user, 'rejected')}
                              className="px-3 py-1 text-xs rounded border border-red-600 text-red-700 hover:bg-red-600 hover:text-white disabled:opacity-50"
                            >
                              {isUpdating ? '…' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {user.approvalStatus === 'rejected' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => updateStatus(user, 'approved')}
                              className="px-3 py-1 text-xs rounded border border-green-600 text-green-700 hover:bg-green-600 hover:text-white disabled:opacity-50"
                            >
                              {isUpdating ? '…' : 'Approve'}
                            </button>
                          )}
                          <span className="text-xs text-gray-400 italic">No pending action</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No registrations found.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RegistrationsPage() {
  return (
    <AdminGuard>
      <RegistrationsInner />
    </AdminGuard>
  )
}
