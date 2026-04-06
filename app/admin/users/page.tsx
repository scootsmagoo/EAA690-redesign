'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminGuard from '@/components/AdminGuard'
import { useSession } from '@/lib/better-auth-client'
import Link from 'next/link'

type UserRole = 'admin' | 'editor' | 'user'

interface User {
  id: string
  name: string
  email: string
  role: UserRole | null
  emailVerified: boolean
  createdAt: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  user: 'Member',
}

const ROLE_BADGE: Record<UserRole, string> = {
  admin: 'bg-eaa-blue text-white',
  editor: 'bg-purple-100 text-purple-800',
  user: 'bg-gray-100 text-gray-700',
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full site + admin dashboard access',
  editor: 'Sanity content studio access',
  user: 'Standard member access',
}

function RoleBadge({ role }: { role: UserRole | null }) {
  const r = role ?? 'user'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[r as UserRole]}`}>
      {ROLE_LABELS[r as UserRole] ?? r}
    </span>
  )
}

function UserManagementInner() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')
      setUsers(data.users)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdating(userId)
    setToast('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update role')
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      setToast(`Role updated to ${ROLE_LABELS[newRole]}`)
      setTimeout(() => setToast(''), 3000)
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Update failed')
      setTimeout(() => setToast(''), 4000)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-eaa-light-blue hover:underline mb-2 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-eaa-blue">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Role legend */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
          <div key={role} className="flex items-start gap-2">
            <RoleBadge role={role} />
            <span className="text-xs text-gray-600">{ROLE_DESCRIPTIONS[role]}</span>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 px-4 py-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-800">
          {toast}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Table */}
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
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const isSelf = user.id === session?.user?.id
                const isUpdating = updating === user.id
                const currentRole = (user.role ?? 'user') as UserRole
                return (
                  <tr key={user.id} className={isSelf ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || '—'}
                        {isSelf && (
                          <span className="ml-2 text-xs text-eaa-light-blue">(you)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={currentRole} />
                    </td>
                    <td className="px-6 py-4">
                      {isSelf ? (
                        <span className="text-xs text-gray-400 italic">Cannot change own role</span>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {(['admin', 'editor', 'user'] as UserRole[])
                            .filter((r) => r !== currentRole)
                            .map((role) => (
                              <button
                                key={role}
                                disabled={isUpdating}
                                onClick={() => handleRoleChange(user.id, role)}
                                className={`px-3 py-1 text-xs rounded border transition-colors disabled:opacity-50
                                  ${role === 'admin'
                                    ? 'border-eaa-blue text-eaa-blue hover:bg-eaa-blue hover:text-white'
                                    : role === 'editor'
                                    ? 'border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white'
                                    : 'border-gray-400 text-gray-600 hover:bg-gray-200'
                                  }`}
                              >
                                {isUpdating ? '…' : `→ ${ROLE_LABELS[role]}`}
                              </button>
                            ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function UsersPage() {
  return (
    <AdminGuard>
      <UserManagementInner />
    </AdminGuard>
  )
}
