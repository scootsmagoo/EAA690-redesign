import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getNewsletterSectionBySlug,
  getNewsletterSectionSlugs,
} from '@/lib/sanity'
import IssueCard from '@/components/newsletter/IssueCard'
import type { NewsletterIssueListRow } from '@/lib/newsletter'

export const revalidate = 120

type SectionDoc = {
  _id: string
  title?: string
  slug?: { current?: string }
  description?: string
  issues?: NewsletterIssueListRow[]
} | null

export async function generateStaticParams() {
  try {
    const rows = await getNewsletterSectionSlugs()
    return (rows ?? [])
      .filter((r) => Boolean(r.slug))
      .map((r) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let section: SectionDoc = null
  try {
    section = (await getNewsletterSectionBySlug(slug)) as SectionDoc
  } catch {
    section = null
  }
  if (!section?.title) {
    return { title: 'NAVCOM section' }
  }
  const description =
    section.description?.trim() ||
    `NAVCOM newsletter issues that include the "${section.title}" section.`
  return {
    title: `${section.title} — NAVCOM`,
    description,
    alternates: {
      canonical: section.slug?.current
        ? `/newsletter/sections/${section.slug.current}`
        : '/newsletter',
    },
    openGraph: {
      title: `${section.title} — NAVCOM`,
      description,
      type: 'website',
    },
  }
}

export default async function NewsletterSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let section: SectionDoc = null
  try {
    section = (await getNewsletterSectionBySlug(slug)) as SectionDoc
  } catch {
    notFound()
  }
  if (!section || !section.title) notFound()

  const issues = section.issues ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <Link
          href="/newsletter"
          className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
        >
          NAVCOM
        </Link>
        <span className="mx-2 text-gray-400" aria-hidden="true">
          /
        </span>
        <span className="text-gray-600">Sections</span>
        <span className="mx-2 text-gray-400" aria-hidden="true">
          /
        </span>
        <span className="text-gray-600">{section.title}</span>
      </nav>

      <header className="mb-10">
        <p className="text-eaa-light-blue font-semibold tracking-wide uppercase text-xs sm:text-sm mb-2">
          NAVCOM section
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-eaa-blue mb-3">{section.title}</h1>
        {section.description ? (
          <p className="text-lg text-gray-700 max-w-2xl leading-relaxed">{section.description}</p>
        ) : null}
        <p className="text-sm text-gray-600 mt-3">
          {issues.length === 1 ? '1 issue' : `${issues.length} issues`} include this section.
        </p>
      </header>

      {issues.length === 0 ? (
        <p className="text-gray-600 py-8">
          No NAVCOM issues are tagged with this section yet. Check back soon, or browse the full archive.
        </p>
      ) : (
        <ul className="space-y-6">
          {issues.map((issue) => (
            <IssueCard key={issue._id} issue={issue} view="list" maxSections={4} />
          ))}
        </ul>
      )}

      <Link
        href="/newsletter"
        className="mt-10 inline-flex items-center gap-1 text-sm text-eaa-light-blue hover:text-eaa-blue font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to NAVCOM archive
      </Link>
    </div>
  )
}
