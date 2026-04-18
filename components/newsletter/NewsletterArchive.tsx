'use client'

import { useId, useMemo, useState, useTransition, useDeferredValue } from 'react'
import IssueCard from './IssueCard'
import { issueYear, type NewsletterIssueListRow } from '@/lib/newsletter'

type Section = {
  _id: string
  title: string
  slug?: { current?: string }
}

type Props = {
  issues: NewsletterIssueListRow[]
  sections: Section[]
  initialYear: number | null
  initialSectionSlug: string | null
}

type ViewMode = 'list' | 'grid'

const VIEW_STORAGE_KEY = 'eaa-newsletter-view'

function readInitialView(): ViewMode {
  if (typeof window === 'undefined') return 'list'
  try {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    return stored === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

/**
 * Lowercase + collapse whitespace haystack used for the keyword filter.
 * Keeps logic predictable and avoids regex injection — every needle is matched
 * as a literal substring.
 */
function buildHaystack(i: NewsletterIssueListRow): string {
  return [
    i.title,
    i.volumeLabel,
    i.excerpt,
    ...(i.sections ?? []).map((s) => s?.title ?? ''),
    issueYear(i.issueDate)?.toString() ?? '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function tokenize(query: string): string[] {
  // Cap input length defensively (OWASP A05 — limit untrusted input).
  return query
    .slice(0, 120)
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

export default function NewsletterArchive({
  issues,
  sections,
  initialYear,
  initialSectionSlug,
}: Props) {
  const [view, setView] = useState<ViewMode>(() => readInitialView())
  const [year, setYear] = useState<number | null>(initialYear)
  const [sectionSlug, setSectionSlug] = useState<string | null>(initialSectionSlug)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [, startTransition] = useTransition()

  const yearLabelId = useId()
  const sectionLabelId = useId()
  const searchId = useId()
  const liveRegionId = useId()

  function persistView(next: ViewMode) {
    setView(next)
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next)
    } catch {
      // Ignore — view preference is non-essential.
    }
  }

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          issues
            .map((i) => issueYear(i.issueDate))
            .filter((y): y is number => y !== null)
        )
      ).sort((a, b) => b - a),
    [issues]
  )

  const visibleSections = useMemo(
    () => sections.filter((s) => s.slug?.current && s.title),
    [sections]
  )

  const filtered = useMemo(() => {
    const tokens = tokenize(deferredQuery)
    return issues.filter((i) => {
      if (year !== null && issueYear(i.issueDate) !== year) return false
      if (sectionSlug) {
        const matched = (i.sections ?? []).some((s) => s?.slug?.current === sectionSlug)
        if (!matched) return false
      }
      if (tokens.length > 0) {
        const hay = buildHaystack(i)
        for (const t of tokens) {
          if (!hay.includes(t)) return false
        }
      }
      return true
    })
  }, [issues, year, sectionSlug, deferredQuery])

  const resultCountLabel =
    filtered.length === 1 ? '1 issue matches your filters.' : `${filtered.length} issues match your filters.`

  function chooseYear(next: number | null) {
    startTransition(() => setYear(next))
  }
  function chooseSection(next: string | null) {
    startTransition(() => setSectionSlug(next))
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
        <div>
          <label htmlFor={searchId} className="block text-sm font-semibold text-gray-700 mb-1.5">
            Search NAVCOM issues
          </label>
          <div className="relative">
            <input
              id={searchId}
              type="search"
              inputMode="search"
              autoComplete="off"
              maxLength={120}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, volume, or section…"
              aria-describedby={liveRegionId}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-eaa-blue focus:border-eaa-blue"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-eaa-blue text-sm font-semibold rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue"
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <fieldset
            className="inline-flex rounded-lg border border-gray-300 overflow-hidden"
            aria-label="Choose archive view"
          >
            <legend className="sr-only">Choose archive view</legend>
            <button
              type="button"
              onClick={() => persistView('list')}
              aria-pressed={view === 'list'}
              className={`px-3 py-2 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-inset ${
                view === 'list' ? 'bg-eaa-blue text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm1 4a1 1 0 100 2h12a1 1 0 100-2H4z" clipRule="evenodd" />
              </svg>
              List
            </button>
            <button
              type="button"
              onClick={() => persistView('grid')}
              aria-pressed={view === 'grid'}
              className={`px-3 py-2 text-sm font-semibold inline-flex items-center gap-1.5 border-l border-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-inset ${
                view === 'grid' ? 'bg-eaa-blue text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
              </svg>
              Grid
            </button>
          </fieldset>
        </div>
      </div>

      {years.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-labelledby={yearLabelId}>
          <span id={yearLabelId} className="text-sm font-medium text-gray-600 mr-1">
            Year:
          </span>
          <button
            type="button"
            onClick={() => chooseYear(null)}
            aria-pressed={year === null}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 ${
              year === null ? 'bg-eaa-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => chooseYear(y)}
              aria-pressed={year === y}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 ${
                year === y ? 'bg-eaa-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      ) : null}

      {visibleSections.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-labelledby={sectionLabelId}>
          <span id={sectionLabelId} className="text-sm font-medium text-gray-600 mr-1">
            Section:
          </span>
          <button
            type="button"
            onClick={() => chooseSection(null)}
            aria-pressed={sectionSlug === null}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 ${
              sectionSlug === null ? 'bg-eaa-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All sections
          </button>
          {visibleSections.map((s) => {
            const slug = s.slug!.current!
            return (
              <button
                key={s._id}
                type="button"
                onClick={() => chooseSection(slug)}
                aria-pressed={sectionSlug === slug}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 ${
                  sectionSlug === slug ? 'bg-eaa-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.title}
              </button>
            )
          })}
        </div>
      ) : null}

      <p
        id={liveRegionId}
        role="status"
        aria-live="polite"
        className="text-sm text-gray-600 mb-4"
      >
        {resultCountLabel}
      </p>

      {filtered.length === 0 ? (
        <p className="text-gray-600 py-8">
          No issues match your filters. Try clearing the search or selecting a different year.
        </p>
      ) : view === 'grid' ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((issue) => (
            <IssueCard key={issue._id} issue={issue} view="grid" />
          ))}
        </ul>
      ) : (
        <ul className="space-y-6">
          {filtered.map((issue) => (
            <IssueCard key={issue._id} issue={issue} view="list" />
          ))}
        </ul>
      )}
    </div>
  )
}
