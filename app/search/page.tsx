import Link from 'next/link'
import { runSiteSearch } from '@/lib/site-search'
import { normalizeSearchQuery } from '@/lib/search-safety'
import type { Metadata } from 'next'
import SearchForm from '@/components/SearchForm'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search EAA Chapter 690 pages, news, events, and programs.',
  robots: { index: false, follow: true },
}

type Props = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: raw } = await searchParams
  const q = normalizeSearchQuery(raw ?? '')
  const results = q ? await runSiteSearch(q) : []

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 id="search-page-heading" className="text-3xl font-bold text-eaa-blue mb-6">
        Search
      </h1>

      <div className="mb-10">
        <SearchForm initialQuery={q} showVisibleLabel />
      </div>

      {q && results.length > 0 ? (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {`${results.length} result${results.length === 1 ? '' : 's'} found.`}
        </p>
      ) : null}

      {!q && (
        <p className="text-gray-600">
          Enter keywords to find pages, programs, and content from the chapter site (and from the CMS when
          configured).
        </p>
      )}

      {q && results.length === 0 && (
        <p className="text-gray-700" role="status">
          No results for &ldquo;<span className="wrap-break-word">{q}</span>
          &rdquo;. Try different words, or browse the{' '}
          <Link href="/chapter" className="text-eaa-light-blue font-semibold hover:underline">
            chapter
          </Link>{' '}
          and{' '}
          <Link href="/programs" className="text-eaa-light-blue font-semibold hover:underline">
            programs
          </Link>{' '}
          sections.
        </p>
      )}

      {q && results.length > 0 && (
        <section aria-labelledby="search-page-heading" aria-label="Search results">
          <ul className="space-y-6 list-none p-0 m-0">
            {results.map((hit) => (
              <li key={`${hit.href}-${hit.title}`}>
                <article className="border-b border-gray-100 pb-6">
                  <h2 className="text-xl font-semibold text-eaa-blue">
                    <Link href={hit.href} className="hover:underline">
                      {hit.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 font-mono break-all" title={hit.href}>
                    {hit.href}
                  </p>
                  {hit.snippet ? (
                    <p className="text-gray-700 mt-2 leading-relaxed">{hit.snippet}</p>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
