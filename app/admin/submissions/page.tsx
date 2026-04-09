'use client'

import AdminGuard from '@/components/AdminGuard'
import { orderedSubmissionEntries, submissionFieldLabel } from '@/lib/submission-field-order'
import { useEffect, useState, useCallback } from 'react'

type FormType = 'summer_camp' | 'scholarship' | 'vmc_imc' | 'youth_aviation'
type Status = 'pending' | 'reviewed' | 'accepted' | 'declined'

interface Submission {
  id: string
  form_type: FormType
  submitted_at: string
  data: Record<string, unknown>
  status: Status
}

const FORM_LABELS: Record<FormType, string> = {
  summer_camp: 'Summer Camp',
  scholarship: 'Scholarship',
  vmc_imc: 'VMC/IMC Club',
  youth_aviation: 'Youth Aviation',
}

const STATUS_COLORS: Record<Status, string> = {
  pending:  'bg-amber-100 text-amber-800',
  reviewed: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
}

const ALL_TYPES: Array<FormType | 'all'> = ['all', 'summer_camp', 'scholarship', 'vmc_imc', 'youth_aviation']

function fmt(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<FormType | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const url = filter === 'all'
        ? '/api/admin/submissions'
        : `/api/admin/submissions?type=${filter}`
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load submissions')
      const json = await res.json()
      setSubmissions(json.submissions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: Status) {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  function downloadCsv() {
    const url = filter === 'all'
      ? '/api/admin/submissions?export=csv'
      : `/api/admin/submissions?type=${filter}&export=csv`
    window.open(url, '_blank')
  }

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-eaa-blue">Program Submissions</h1>
            <p className="text-gray-500 mt-1">Form submissions from program pages</p>
          </div>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-eaa-blue text-white text-sm font-semibold rounded-md hover:bg-eaa-light-blue transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === t
                  ? 'bg-eaa-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'All Forms' : FORM_LABELS[t]}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-gray-500 py-12 text-center">Loading submissions…</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <p className="text-gray-500">No submissions yet for this filter.</p>
          </div>
        )}

        {!loading && submissions.length > 0 && (
          <div className="space-y-3">
            {submissions.map((s) => {
              const isOpen = expanded === s.id
              // Pick a meaningful "name" field from the data payload
              const displayName =
                fmt(s.data.applicant_name) !== '—' ? fmt(s.data.applicant_name) :
                fmt(s.data.name) !== '—' ? fmt(s.data.name) :
                s.data.camper_first_name
                  ? `${fmt(s.data.camper_first_name)} ${fmt(s.data.camper_last_name)}`
                  : fmt(s.data.youth_name) !== '—' ? fmt(s.data.youth_name) :
                  '(no name)'

              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Row header — W5: aria-expanded + aria-controls link button to its panel */}
                  <button
                    className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                    aria-expanded={isOpen}
                    aria-controls={`details-${s.id}`}
                  >
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[s.status]}`}>
                      {s.status}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {FORM_LABELS[s.form_type]}
                    </span>
                    <span className="font-semibold text-eaa-blue flex-1 truncate">{displayName}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(s.submitted_at)}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded detail panel */}
                  {isOpen && (
                    <div id={`details-${s.id}`} className="border-t border-gray-100 px-5 py-5 bg-gray-50">
                      {/* Status controls */}
                      <div className="flex flex-wrap items-center gap-2 mb-5">
                        <span className="text-sm font-medium text-gray-600 mr-1">Status:</span>
                        {(['pending', 'reviewed', 'accepted', 'declined'] as Status[]).map((st) => (
                          <button
                            key={st}
                            disabled={s.status === st || updatingId === s.id}
                            onClick={() => updateStatus(s.id, st)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors disabled:opacity-40 ${
                              s.status === st
                                ? STATUS_COLORS[st] + ' border-transparent'
                                : 'border-gray-300 text-gray-600 hover:border-eaa-blue hover:text-eaa-blue'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                        {updatingId === s.id && (
                          <span className="text-xs text-gray-400 ml-1">Saving…</span>
                        )}
                      </div>

                      {/* Data table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <tbody>
                            {orderedSubmissionEntries(s.form_type, s.data).map(([k, v]) => (
                              <tr key={k} className="border-b border-gray-100 last:border-0">
                                <td className="py-2 pr-4 font-medium text-gray-500 whitespace-nowrap align-top w-48">
                                  {submissionFieldLabel(k)}
                                </td>
                                <td className="py-2 text-gray-800 break-words">
                                  {fmt(v)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Print */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => window.print()}
                          className="text-xs text-gray-500 hover:text-eaa-blue flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
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
