'use client'

import AdminGuard from '@/components/AdminGuard'
import {
  CONTACT_SUBJECT_KEYS,
  getContactSubjectLabel,
  type ContactSubjectKey,
} from '@/lib/contact-categories'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type Status = 'pending' | 'reviewed' | 'accepted' | 'declined'

interface ContactMessage {
  id: string
  form_type: 'contact'
  submitted_at: string
  data: Record<string, unknown>
  status: Status
}

const STATUS_COLORS: Record<Status, string> = {
  pending: 'bg-amber-100 text-amber-800',
  reviewed: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
}

function fmt(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function subjectLabelFromData(data: Record<string, unknown>): string {
  const s = data.subject
  if (typeof s === 'string' && (CONTACT_SUBJECT_KEYS as readonly string[]).includes(s)) {
    return getContactSubjectLabel(s as ContactSubjectKey)
  }
  return fmt(s)
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/contact-messages', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load messages')
      const json = await res.json()
      setMessages(json.messages ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function updateStatus(id: string, status: Status) {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  function downloadCsv() {
    window.open('/api/admin/contact-messages?export=csv', '_blank')
  }

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-eaa-blue">Contact messages</h1>
            <p className="text-gray-500 mt-1">
              Submissions from the public{' '}
              <Link href="/contact" className="text-eaa-light-blue hover:underline">
                /contact
              </Link>{' '}
              page. Program registrations stay on{' '}
              <Link href="/admin/submissions" className="text-eaa-light-blue hover:underline">
                Program Submissions
              </Link>
              .
            </p>
          </div>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-eaa-blue text-white text-sm font-semibold rounded-md hover:bg-eaa-light-blue transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>
        </div>

        {loading && <p className="text-gray-500 py-12 text-center">Loading…</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">{error}</div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <p className="text-gray-500">No contact messages yet.</p>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div className="space-y-3">
            {messages.map((m) => {
              const isOpen = expanded === m.id
              return (
                <div key={m.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                    aria-expanded={isOpen}
                    aria-controls={`details-${m.id}`}
                  >
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[m.status]}`}
                    >
                      {m.status}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{subjectLabelFromData(m.data)}</span>
                    <span className="font-semibold text-eaa-blue flex-1 truncate">{fmt(m.data.name)}</span>
                    <span className="text-sm text-gray-600 truncate max-w-xs">{fmt(m.data.email)}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(m.submitted_at)}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div id={`details-${m.id}`} className="border-t border-gray-100 px-5 py-5 bg-gray-50">
                      <div className="flex flex-wrap items-center gap-2 mb-5">
                        <span className="text-sm font-medium text-gray-600 mr-1">Status:</span>
                        {(['pending', 'reviewed', 'accepted', 'declined'] as Status[]).map((st) => (
                          <button
                            key={st}
                            disabled={m.status === st || updatingId === m.id}
                            onClick={() => updateStatus(m.id, st)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors disabled:opacity-40 ${
                              m.status === st
                                ? STATUS_COLORS[st] + ' border-transparent'
                                : 'border-gray-300 text-gray-600 hover:border-eaa-blue hover:text-eaa-blue'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                        {updatingId === m.id && <span className="text-xs text-gray-400 ml-1">Saving…</span>}
                      </div>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div>
                          <dt className="font-medium text-gray-500">Category</dt>
                          <dd className="text-gray-800">{subjectLabelFromData(m.data)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">Name</dt>
                          <dd className="text-gray-800 break-words">{fmt(m.data.name)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">Email</dt>
                          <dd>
                            {typeof m.data.email === 'string' && m.data.email ? (
                              <a
                                href={`mailto:${m.data.email}`}
                                className="text-eaa-light-blue hover:underline break-all"
                              >
                                {m.data.email}
                              </a>
                            ) : (
                              '—'
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">Phone</dt>
                          <dd className="text-gray-800">{fmt(m.data.phone) || '—'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-500">Message</dt>
                          <dd className="text-gray-800 whitespace-pre-wrap break-words mt-1 p-3 bg-white rounded-lg border border-gray-100">
                            {fmt(m.data.message)}
                          </dd>
                        </div>
                        <div className="text-xs text-gray-400 sm:col-span-2">ID: {m.id}</div>
                      </dl>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => window.print()}
                          className="text-xs text-gray-500 hover:text-eaa-blue flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                            />
                          </svg>
                          Print
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
