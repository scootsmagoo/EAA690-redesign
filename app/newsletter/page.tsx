import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getLatestNewsletterIssue,
  getNewsletterIssues,
  getNewsletterPage,
  getNewsletterSections,
  getSiteSettings,
} from '@/lib/sanity'
import { issueYear, type NewsletterIssueListRow } from '@/lib/newsletter'
import NewsletterPageHero from '@/components/newsletter/NewsletterPageHero'
import LatestIssueHero from '@/components/newsletter/LatestIssueHero'
import NewsletterArchive from '@/components/newsletter/NewsletterArchive'
import SubscribeCta from '@/components/newsletter/SubscribeCta'

export const revalidate = 120

const FALLBACK_DESCRIPTION =
  'Browse the EAA Chapter 690 NAVCOM newsletter — monthly chapter news, programs, member stories, and the full PDF archive going back to 1980.'

type NewsletterPageDoc = {
  seoTitle?: string
  seoDescription?: string
  pageTitle?: string
  tagline?: string
  intro?: string
  subscribeBlurb?: string
  heroImage?: unknown
  heroImageAlt?: string | null
} | null

export async function generateMetadata(): Promise<Metadata> {
  let page: NewsletterPageDoc = null
  try {
    page = (await getNewsletterPage()) as NewsletterPageDoc
  } catch {
    page = null
  }
  const title = page?.seoTitle?.trim() || page?.pageTitle?.trim() || 'NAVCOM newsletter'
  const description = page?.seoDescription?.trim() || FALLBACK_DESCRIPTION
  return {
    title,
    description,
    alternates: {
      canonical: '/newsletter',
      types: {
        'application/rss+xml': '/newsletter/feed.xml',
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: '/newsletter',
    },
  }
}

type Props = {
  searchParams: Promise<{ year?: string; section?: string }>
}

type SectionRow = {
  _id: string
  title: string
  slug?: { current?: string }
  description?: string
}

export default async function NewsletterArchivePage({ searchParams }: Props) {
  const params = await searchParams
  const yearParam = typeof params.year === 'string' ? params.year : undefined
  const sectionParam = typeof params.section === 'string' ? params.section.trim().slice(0, 64) : undefined
  const parsed = yearParam ? parseInt(yearParam, 10) : NaN
  const selectedYear = Number.isFinite(parsed) ? parsed : null

  const [issuesRaw, latestRaw, pageRaw, sections, settings] = await Promise.all([
    safe<NewsletterIssueListRow[]>(getNewsletterIssues, []),
    safe(getLatestNewsletterIssue, null),
    safe(getNewsletterPage, null),
    safe<SectionRow[]>(getNewsletterSections, []),
    safe(getSiteSettings, null),
  ])
  const page = pageRaw as NewsletterPageDoc

  const issues = Array.isArray(issuesRaw) ? issuesRaw : []
  const validatedSectionSlug = sectionParam
    ? sections.find((s) => s.slug?.current === sectionParam)?.slug?.current ?? null
    : null

  const legacyArchiveUrl =
    (settings as { newsletterArchiveFolderUrl?: string } | null)?.newsletterArchiveFolderUrl?.trim() || null
  const fallbackPdfUrl =
    (settings as { newsletterUrl?: string } | null)?.newsletterUrl?.trim() || null

  const years = Array.from(
    new Set(issues.map((i) => issueYear(i.issueDate)).filter((y): y is number => y !== null))
  )

  const issueCount = issues.length
  const oldestYear = years.length > 0 ? Math.min(...years) : null
  const newestYear = years.length > 0 ? Math.max(...years) : null

  const subscribeBlurb = page?.subscribeBlurb ?? null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-eaa-light-blue mb-6" aria-label="Breadcrumb">
        <Link
          href="/"
          className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
        >
          Home
        </Link>
        <span className="mx-2 text-gray-400" aria-hidden="true">
          /
        </span>
        <span className="text-gray-600">NAVCOM</span>
      </nav>

      <NewsletterPageHero page={page as unknown as Parameters<typeof NewsletterPageHero>[0]['page']} />

      {issueCount === 0 && fallbackPdfUrl ? (
        <section className="mb-10 rounded-2xl border-2 border-eaa-blue/15 bg-blue-50/40 p-6">
          <h2 className="text-lg font-bold text-eaa-blue mb-1">Latest issue (PDF)</h2>
          <p className="text-sm text-gray-700 mb-3">
            Web issues are being migrated. Meanwhile, the latest NAVCOM PDF is available below.
          </p>
          <a
            href={fallbackPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-eaa-blue text-white px-5 py-2.5 text-sm font-semibold hover:bg-eaa-light-blue transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
            aria-label="Open latest NAVCOM PDF (opens in a new tab)"
          >
            Open latest PDF
          </a>
        </section>
      ) : null}

      {latestRaw ? (
        <LatestIssueHero issue={latestRaw as Parameters<typeof LatestIssueHero>[0]['issue']} />
      ) : null}

      <SubscribeCta blurb={subscribeBlurb} />

      <section aria-labelledby="navcom-archive-heading" className="mt-2">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5 border-b border-gray-200 pb-3">
          <div>
            <h2 id="navcom-archive-heading" className="text-2xl font-bold text-eaa-blue">
              Archive
            </h2>
            {issueCount > 0 ? (
              <p className="text-sm text-gray-600">
                {issueCount === 1 ? '1 issue' : `${issueCount} issues`}
                {oldestYear !== null && newestYear !== null && oldestYear !== newestYear
                  ? ` · ${oldestYear} – ${newestYear}`
                  : null}
              </p>
            ) : (
              <p className="text-sm text-gray-600">No NAVCOM issues are published yet.</p>
            )}
          </div>
          <a
            href="/newsletter/feed.xml"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-eaa-light-blue hover:text-eaa-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M3 5a1 1 0 011-1c7.18 0 13 5.82 13 13a1 1 0 11-2 0c0-6.075-4.925-11-11-11a1 1 0 01-1-1z" />
              <path d="M3 11a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1z" />
              <circle cx="5" cy="15" r="2" />
            </svg>
            RSS feed
          </a>
        </div>

        {issueCount === 0 ? (
          <p className="text-gray-600 py-8">
            No newsletter issues are published here yet. Editors can add issues in Sanity Studio under{' '}
            <strong className="font-medium text-gray-800">NAVCOM Issues</strong>.
          </p>
        ) : (
          <NewsletterArchive
            issues={issues}
            sections={sections.map((s) => ({ _id: s._id, title: s.title, slug: s.slug }))}
            initialYear={selectedYear}
            initialSectionSlug={validatedSectionSlug}
          />
        )}

        {legacyArchiveUrl ? (
          <div className="mt-12 rounded-lg border border-blue-100 bg-blue-50/80 px-5 py-4 text-gray-800">
            <p className="font-semibold text-eaa-blue mb-1">Older PDF archive</p>
            <p className="text-sm text-gray-700 mb-3">
              Many older issues live in our historical Google Drive folder, including editions from before this
              site’s archive.
            </p>
            <a
              href={legacyArchiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-semibold text-eaa-light-blue hover:text-eaa-blue underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
            >
              Open full PDF archive (folder)
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        ) : null}
      </section>
    </div>
  )
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}
