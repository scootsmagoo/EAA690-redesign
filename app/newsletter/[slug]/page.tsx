import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PortableText } from '@portabletext/react'
import {
  getAdjacentNewsletterIssues,
  getNewsletterIssueBySlug,
  getNewsletterIssueSlugs,
  urlFor,
} from '@/lib/sanity'
import {
  formatNewsletterIssueDate,
  getNewsletterIssuePdfHref,
  getNewsletterIssueUrl,
  newsletterIssueIsoDate,
  type NewsletterIssueListRow,
  type NewsletterTocItem,
} from '@/lib/newsletter'
import { safePortableTextLinkHref } from '@/lib/search-safety'
import { getSiteBaseURL } from '@/lib/site-url'
import IssueTableOfContents from '@/components/newsletter/IssueTableOfContents'
import IssueShareToolbar from '@/components/newsletter/IssueShareToolbar'
import IssuePdfPanel from '@/components/newsletter/IssuePdfPanel'
import IssuePrevNext from '@/components/newsletter/IssuePrevNext'

export const revalidate = 120

type IssueDoc = NewsletterIssueListRow & {
  content?: unknown
  tableOfContents?: NewsletterTocItem[] | null
  seoTitle?: string
  seoDescription?: string
}

export async function generateStaticParams() {
  try {
    const rows = await getNewsletterIssueSlugs()
    return (rows ?? [])
      .filter((r: { slug?: string }) => Boolean(r.slug))
      .map((r: { slug: string }) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

const portableTextComponents = {
  types: {
    image: ({ value }: { value: { caption?: string; alt?: string } }) => {
      const src = urlFor(value).width(900).fit('max').auto('format').url()
      const caption =
        typeof value.caption === 'string' && value.caption.trim() ? value.caption.trim() : ''
      const altCandidate = typeof value.alt === 'string' && value.alt.trim() ? value.alt.trim() : ''
      const alt = altCandidate || caption || ''
      return (
        <figure className="my-6">
          <Image
            src={src}
            alt={alt}
            width={900}
            height={600}
            className="rounded-lg w-full object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
          {caption ? (
            <figcaption className="mt-2 text-center text-sm text-gray-500 italic">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      )
    },
  },
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl font-bold text-eaa-blue mt-8 mb-3">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl font-bold text-eaa-blue mt-6 mb-2">{children}</h3>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-4 border-eaa-yellow pl-4 italic text-gray-600 my-4">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => {
      const safe = safePortableTextLinkHref(value?.href)
      if (!safe) {
        return <span className="underline decoration-gray-400">{children}</span>
      }
      if (safe.startsWith('http://') || safe.startsWith('https://')) {
        return (
          <a
            href={safe}
            className="text-eaa-blue underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        )
      }
      return (
        <Link
          href={safe}
          className="text-eaa-blue underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
        >
          {children}
        </Link>
      )
    },
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let issue: IssueDoc | null = null
  try {
    issue = (await getNewsletterIssueBySlug(slug)) as IssueDoc | null
  } catch {
    issue = null
  }
  if (!issue?.title) {
    return { title: 'NAVCOM Issue' }
  }
  const baseUrl = getSiteBaseURL()
  const canonical = getNewsletterIssueUrl(issue.slug?.current, baseUrl) ?? '/newsletter'
  const ogImage = issue.coverImage
    ? urlFor(issue.coverImage).width(1200).height(630).fit('crop').auto('format').url()
    : undefined
  const description =
    issue.seoDescription ||
    issue.excerpt ||
    `EAA Chapter 690 NAVCOM newsletter — ${issue.title}.`
  return {
    title: issue.seoTitle || `${issue.title} | NAVCOM`,
    description,
    alternates: { canonical },
    openGraph: {
      title: issue.seoTitle || `${issue.title} | NAVCOM`,
      description,
      type: 'article',
      url: canonical,
      publishedTime: issue.issueDate || undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: issue.coverImageAlt || issue.title }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: issue.seoTitle || `${issue.title} | NAVCOM`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function NewsletterIssuePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let issue: IssueDoc | null = null
  try {
    issue = (await getNewsletterIssueBySlug(slug)) as IssueDoc | null
  } catch {
    notFound()
  }
  if (!issue) notFound()

  const baseUrl = getSiteBaseURL()
  const canonical = getNewsletterIssueUrl(issue.slug?.current, baseUrl) ?? `${baseUrl}/newsletter`
  const pdfHref = getNewsletterIssuePdfHref(issue)
  const coverUrl = issue.coverImage
    ? urlFor(issue.coverImage).width(960).height(520).fit('crop').auto('format').url()
    : null
  const coverOgUrl = issue.coverImage
    ? urlFor(issue.coverImage).width(1200).height(630).fit('crop').auto('format').url()
    : null
  const coverAlt = issue.coverImageAlt?.trim() || (issue.title ? `Cover: ${issue.title}` : 'NAVCOM cover')
  const hasBody = Array.isArray(issue.content) && (issue.content as unknown[]).length > 0
  const sections = (issue.sections ?? []).filter((s) => s?.title && s.slug?.current)

  const adjacent = issue.issueDate
    ? await safe(() => getAdjacentNewsletterIssues(issue!.issueDate!, issue!._id), {
        previous: null,
        next: null,
      })
    : { previous: null, next: null }

  // JSON-LD: schema.org PublicationIssue. Helps Google/social previews;
  // safe to render server-side as a stringified JSON inside a <script> tag.
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'PublicationIssue',
    name: issue.title,
    headline: issue.title,
    isPartOf: {
      '@type': 'Periodical',
      name: 'NAVCOM',
      alternateName: 'Navigation Communication',
      publisher: {
        '@type': 'Organization',
        name: 'EAA Chapter 690',
        url: baseUrl,
      },
    },
    url: canonical,
    datePublished: issue.issueDate || undefined,
    inLanguage: 'en-US',
    description: issue.excerpt || undefined,
    issueNumber: issue.volumeLabel || undefined,
    image: coverOgUrl || undefined,
    encoding: pdfHref
      ? {
          '@type': 'MediaObject',
          contentUrl: pdfHref,
          encodingFormat: 'application/pdf',
        }
      : undefined,
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 print:py-4">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-eaa-light-blue mb-6 print:hidden" aria-label="Breadcrumb">
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
        <span className="text-gray-600">{issue.title}</span>
      </nav>

      <header className="mb-8">
        <p className="text-sm text-gray-500 mb-2">
          <time dateTime={newsletterIssueIsoDate(issue.issueDate)}>
            {formatNewsletterIssueDate(issue.issueDate)}
          </time>
          {issue.volumeLabel ? ` · ${issue.volumeLabel}` : ''}
          {typeof issue.pageCount === 'number' ? ` · ${issue.pageCount} pages` : ''}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-eaa-blue mb-4">{issue.title}</h1>
        {issue.featured ? (
          <p className="mb-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-eaa-yellow text-eaa-blue px-2.5 py-0.5 text-xs font-bold">
              <span aria-hidden="true">★</span>
              <span>Featured issue</span>
            </span>
          </p>
        ) : null}
        {issue.excerpt ? (
          <p className="text-lg text-gray-700 border-l-4 border-eaa-yellow pl-4 py-1">{issue.excerpt}</p>
        ) : null}
        {sections.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Sections in this issue">
            {sections.map((s) =>
              s.slug?.current ? (
                <li key={s._id}>
                  <Link
                    href={`/newsletter/sections/${s.slug.current}`}
                    className="inline-flex items-center rounded-full border border-eaa-blue/20 bg-blue-50 text-eaa-blue px-2.5 py-0.5 text-xs font-medium hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-1"
                  >
                    {s.title}
                  </Link>
                </li>
              ) : null
            )}
          </ul>
        ) : null}
      </header>

      <IssueShareToolbar shareUrl={canonical} title={issue.title} summary={issue.excerpt} />

      <IssuePdfPanel
        issue={{
          title: issue.title,
          pageCount: issue.pageCount,
          pdf: issue.pdf,
          pdfUrl: issue.pdfUrl,
        }}
      />

      <IssueTableOfContents
        items={issue.tableOfContents}
        issue={{ pdf: issue.pdf, pdfUrl: issue.pdfUrl }}
      />

      {coverUrl ? (
        <figure className="mb-10 rounded-xl overflow-hidden shadow-md print:shadow-none">
          <Image
            src={coverUrl}
            alt={coverAlt}
            width={960}
            height={520}
            className="w-full object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
          {issue.coverImageAlt?.trim() ? (
            <figcaption className="sr-only">{coverAlt}</figcaption>
          ) : null}
        </figure>
      ) : null}

      {hasBody ? (
        <section
          className="prose max-w-none prose-headings:text-eaa-blue prose-a:text-eaa-blue"
          aria-label="Newsletter issue content"
        >
          <PortableText value={issue.content as never} components={portableTextComponents} />
        </section>
      ) : (
        <p className="text-gray-600">
          {pdfHref
            ? 'This issue is published as the PDF above. Open or download it to read the full edition.'
            : 'No web content or PDF has been attached to this issue yet.'}
        </p>
      )}

      <IssuePrevNext previous={adjacent?.previous ?? null} next={adjacent?.next ?? null} />

      <Link
        href="/newsletter"
        className="mt-10 inline-flex items-center gap-1 text-sm text-eaa-light-blue hover:text-eaa-blue font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded print:hidden"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to NAVCOM archive
      </Link>
    </article>
  )
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}
