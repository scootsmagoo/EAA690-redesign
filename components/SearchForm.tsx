'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { MAX_SEARCH_QUERY_LENGTH, normalizeSearchQuery } from '@/lib/search-safety'

type Props = {
  initialQuery?: string
  /** Compact variant for the nav bar (dark theme, small control) */
  compact?: boolean
  /** With `compact`, use full width of the parent instead of capping ~280px (desktop nav sub-row) */
  compactFullWidth?: boolean
  /** WCAG: visible label on the dedicated /search page (not sr-only). */
  showVisibleLabel?: boolean
}

export default function SearchForm({
  initialQuery = '',
  compact = false,
  compactFullWidth = false,
  showVisibleLabel = false,
}: Props) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)

  useEffect(() => {
    setValue(initialQuery)
  }, [initialQuery])

  const inputId = compact ? (compactFullWidth ? 'nav-site-search-wide' : 'nav-site-search') : 'page-site-search'

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = normalizeSearchQuery(value)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    router.push(`/search${params.toString() ? `?${params}` : ''}`)
  }

  const labelText = 'Search this website'

  return (
    <form
      role="search"
      aria-label={compact ? 'Site search' : undefined}
      onSubmit={submit}
      className={
        compact
          ? compactFullWidth
            ? 'flex items-center gap-2 w-full'
            : 'flex items-center gap-1 w-full max-w-[min(100%,280px)]'
          : 'flex flex-col sm:flex-row gap-3 sm:items-end'
      }
    >
      <div className={compact ? 'flex-1 min-w-0' : 'flex-1 w-full sm:w-auto'}>
        <label
          htmlFor={inputId}
          className={
            showVisibleLabel && !compact
              ? 'block text-sm font-medium text-gray-800 mb-2'
              : 'sr-only'
          }
        >
          {labelText}
        </label>
        <input
          id={inputId}
          name="q"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={MAX_SEARCH_QUERY_LENGTH}
          placeholder="Search…"
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_SEARCH_QUERY_LENGTH))}
          className={
            compact
              ? 'w-full rounded-md border border-white/40 bg-white/10 px-2.5 py-1.5 text-sm text-white placeholder:text-white/75 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue'
              : 'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-xs focus:border-eaa-light-blue focus:outline-hidden focus-visible:ring-2 focus-visible:ring-eaa-light-blue/40 focus-visible:ring-offset-2'
          }
        />
      </div>
      <button
        type="submit"
        className={
          compact
            ? 'shrink-0 rounded-md bg-eaa-yellow px-2.5 py-1.5 text-sm font-semibold text-eaa-blue hover:bg-yellow-400 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue'
            : 'rounded-lg bg-eaa-blue px-6 py-2.5 font-semibold text-white hover:bg-eaa-light-blue focus:outline-hidden focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2'
        }
      >
        Search
      </button>
    </form>
  )
}
