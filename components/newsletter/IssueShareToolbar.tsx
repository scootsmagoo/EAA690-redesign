'use client'

import { useEffect, useId, useRef, useState } from 'react'

type Props = {
  shareUrl: string
  title: string
  /** Optional short summary used as the email body / share text. */
  summary?: string
}

/**
 * Per-issue share toolbar. Stays read-only until JS hydrates so non-JS
 * visitors still see the canonical permalink as plain text.
 *
 * Security notes:
 * - `shareUrl` is built server-side from the validated slug; we never inject
 *   it into the DOM as HTML (only as `value` / `href` attributes which
 *   browsers escape).
 * - The mailto subject/body are URI-encoded.
 * - `navigator.share` and `navigator.clipboard` are guarded by feature
 *   detection — falls back to a manual copy via a hidden input + execCommand.
 */
export default function IssueShareToolbar({ shareUrl, title, summary }: Props) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [canNativeShare, setCanNativeShare] = useState(false)
  const fallbackRef = useRef<HTMLInputElement>(null)
  const liveRegionId = useId()

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    if (copyState === 'idle') return
    const t = setTimeout(() => setCopyState('idle'), 2400)
    return () => clearTimeout(t)
  }, [copyState])

  async function handleCopy() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setCopyState('copied')
        return
      }
    } catch {
      // fall through to manual fallback
    }
    try {
      const input = fallbackRef.current
      if (input) {
        input.value = shareUrl
        input.removeAttribute('hidden')
        input.select()
        const ok = document.execCommand?.('copy')
        input.setAttribute('hidden', 'hidden')
        if (ok) {
          setCopyState('copied')
          return
        }
      }
      setCopyState('error')
    } catch {
      setCopyState('error')
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({
        title,
        text: summary || `Read ${title} on EAA Chapter 690`,
        url: shareUrl,
      })
    } catch {
      // user-cancel or unsupported — silently ignore
    }
  }

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const mailtoSubject = encodeURIComponent(`NAVCOM: ${title}`)
  const mailtoBody = encodeURIComponent(
    `${summary ? summary + '\n\n' : ''}Read the issue: ${shareUrl}`
  )
  const mailHref = `mailto:?subject=${mailtoSubject}&body=${mailtoBody}`

  return (
    <div
      className="not-prose mb-8 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 print:hidden"
      role="toolbar"
      aria-label="Share this issue"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 mr-1">
        Share
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
        aria-describedby={liveRegionId}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M8 3a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V7.414A2 2 0 0015.414 6L13 3.586A2 2 0 0011.586 3H8z" />
          <path d="M4 7a2 2 0 012-2v9a3 3 0 003 3h6a2 2 0 01-2 2H6a3 3 0 01-3-3V8a1 1 0 011-1z" />
        </svg>
        {copyState === 'copied' ? 'Link copied' : 'Copy link'}
      </button>
      <a
        href={mailHref}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        Email
      </a>
      {canNativeShare ? (
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Share…
        </button>
      ) : null}
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
            clipRule="evenodd"
          />
        </svg>
        Print
      </button>
      <p
        id={liveRegionId}
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {copyState === 'copied'
          ? 'Issue link copied to clipboard.'
          : copyState === 'error'
            ? 'Could not copy link. Please copy manually.'
            : ''}
      </p>
      {/* Hidden fallback used by document.execCommand('copy') when navigator.clipboard is unavailable. */}
      <input
        ref={fallbackRef}
        type="text"
        readOnly
        defaultValue={shareUrl}
        hidden
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
      />
    </div>
  )
}
