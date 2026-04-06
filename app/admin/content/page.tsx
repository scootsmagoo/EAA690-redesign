'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'

interface Draft {
  id: string
  publishedId: string
  type: string
  typeLabel: string
  title: string
  updatedAt: string
}

const TYPE_COLOR: Record<string, string> = {
  newsArticle:  'bg-blue-100 text-blue-800',
  event:        'bg-green-100 text-green-800',
  presentation: 'bg-purple-100 text-purple-800',
  boardMember:  'bg-yellow-100 text-yellow-800',
  siteSettings: 'bg-gray-100 text-gray-700',
  page:         'bg-orange-100 text-orange-800',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function ContentInner() {
  const [drafts, setDrafts]       = useState<Draft[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [publishing, setPublishing] = useState<string | null>(null)
  const [toast, setToast]         = useState('')

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/admin/sanity')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load drafts')
      setDrafts(data.drafts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDrafts() }, [fetchDrafts])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  async function publish(id: string | '__all__') {
    setPublishing(id)
    try {
      const body = id === '__all__' ? { all: true } : { id }
      const res  = await fetch('/api/admin/sanity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')

      const count = data.published?.length ?? 0
      showToast(count === 1 ? '✅ Published!' : `✅ Published ${count} documents`)
      if (data.errors?.length) {
        console.error('Publish errors:', data.errors)
      }
      await fetchDrafts()
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : 'Publish failed'}`)
    } finally {
      setPublishing(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <Link href="/admin" className="text-sm text-eaa-light-blue hover:underline mb-2 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-eaa-blue">Publish Queue</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Drafts waiting to be published to the live site.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDrafts}
            disabled={loading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
          {drafts.length > 1 && (
            <button
              onClick={() => publish('__all__')}
              disabled={!!publishing}
              className="px-4 py-2 text-sm bg-eaa-blue text-white rounded-md hover:bg-eaa-light-blue disabled:opacity-50 transition-colors"
            >
              {publishing === '__all__' ? 'Publishing…' : `Publish All (${drafts.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Open Studio link */}
      <div className="mb-6">
        <Link
          href="/studio"
          className="text-sm text-eaa-light-blue hover:underline"
        >
          Open Content Studio to edit →
        </Link>
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
          {error.includes('SANITY_API_TOKEN') && (
            <p className="mt-1 text-xs">
              Add <code className="bg-red-100 px-1 rounded">SANITY_API_TOKEN</code> to your Vercel environment variables.
            </p>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eaa-blue" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">All caught up!</h2>
          <p className="text-gray-500 text-sm">No drafts waiting to be published.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white rounded-lg border border-gray-200 px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[draft.type] ?? 'bg-gray-100 text-gray-700'}`}>
                    {draft.typeLabel}
                  </span>
                  <span className="text-xs text-gray-400">edited {timeAgo(draft.updatedAt)}</span>
                </div>
                <p className="font-medium text-gray-900 truncate">{draft.title}</p>
              </div>
              <button
                onClick={() => publish(draft.id)}
                disabled={!!publishing}
                className="shrink-0 px-4 py-2 text-sm bg-eaa-blue text-white rounded-md hover:bg-eaa-light-blue disabled:opacity-50 transition-colors"
              >
                {publishing === draft.id ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ContentPage() {
  return (
    <AdminGuard>
      <ContentInner />
    </AdminGuard>
  )
}
