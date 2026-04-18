import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import {
  formatNewsletterIssueDate,
  getNewsletterIssuePdfHref,
  newsletterIssueIsoDate,
  type NewsletterIssueListRow,
} from '@/lib/newsletter'

type Props = {
  issue: NewsletterIssueListRow & {
    content?: unknown
  }
}

/**
 * Featured "latest issue" card shown at the top of the /newsletter archive.
 * Larger and more visually prominent than IssueCard; communicates which
 * issue is current.
 */
export default function LatestIssueHero({ issue }: Props) {
  const slug = issue.slug?.current
  if (!slug) return null
  const pdfHref = getNewsletterIssuePdfHref(issue)
  const cover = issue.coverImage
    ? urlFor(issue.coverImage).width(800).height(560).fit('crop').auto('format').url()
    : null
  const altText = issue.coverImageAlt?.trim() || (issue.title ? `Cover: ${issue.title}` : 'NAVCOM cover')

  return (
    <section
      aria-labelledby="latest-issue-heading"
      className="mb-12 overflow-hidden rounded-2xl border border-eaa-blue/15 bg-white shadow-md"
    >
      <div className="bg-eaa-blue px-5 py-2.5 flex items-center justify-between">
        <h2
          id="latest-issue-heading"
          className="text-sm font-bold uppercase tracking-wide text-eaa-yellow"
        >
          Latest issue
        </h2>
        {issue.featured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-eaa-yellow text-eaa-blue px-2.5 py-0.5 text-xs font-bold">
            <span aria-hidden="true">★</span>
            <span>Featured</span>
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
        <div className="md:col-span-2 relative bg-gray-100 aspect-[4/3] md:aspect-auto md:min-h-[280px]">
          {cover ? (
            <Image
              src={cover}
              alt={altText}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No cover image
            </div>
          )}
        </div>
        <div className="md:col-span-3 p-6 sm:p-8">
          <p className="text-sm text-gray-500 mb-2">
            <time dateTime={newsletterIssueIsoDate(issue.issueDate)}>
              {formatNewsletterIssueDate(issue.issueDate)}
            </time>
            {issue.volumeLabel ? <span className="text-gray-400"> · {issue.volumeLabel}</span> : null}
            {typeof issue.pageCount === 'number' ? (
              <span className="text-gray-400"> · {issue.pageCount} pp</span>
            ) : null}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-eaa-blue mb-3 leading-tight">
            <Link
              href={`/newsletter/${slug}`}
              className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
            >
              {issue.title}
            </Link>
          </h3>
          {issue.excerpt ? (
            <p className="text-gray-700 leading-relaxed mb-5 line-clamp-4">{issue.excerpt}</p>
          ) : null}
          {issue.sections && issue.sections.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 mb-5" aria-label="Sections in this issue">
              {issue.sections.slice(0, 5).map((s) =>
                s?.slug?.current ? (
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
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/newsletter/${slug}`}
              className="inline-flex items-center justify-center rounded-full bg-eaa-blue text-white px-5 py-2.5 text-sm font-semibold hover:bg-eaa-light-blue transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
            >
              Read online
            </Link>
            {pdfHref ? (
              <a
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border-2 border-eaa-blue text-eaa-blue px-5 py-2.5 text-sm font-semibold hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
                aria-label={`Download PDF for ${issue.title} (opens in a new tab)`}
              >
                Download PDF
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
