import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import {
  formatNewsletterIssueDate,
  formatNewsletterIssueShortDate,
  getNewsletterIssuePdfHref,
  newsletterIssueIsoDate,
  type NewsletterIssueListRow,
} from '@/lib/newsletter'

type Props = {
  issue: NewsletterIssueListRow
  view: 'list' | 'grid'
  /** Optional cap on number of section badges shown. */
  maxSections?: number
}

const DEFAULT_MAX_SECTIONS = 3

export default function IssueCard({ issue, view, maxSections = DEFAULT_MAX_SECTIONS }: Props) {
  const slug = issue.slug?.current
  if (!slug) return null
  const pdfHref = getNewsletterIssuePdfHref(issue)
  const altText = issue.coverImageAlt?.trim() || (issue.title ? `Cover: ${issue.title}` : 'NAVCOM cover')

  const sections = (issue.sections ?? []).filter((s) => s?.title && s.slug?.current).slice(0, maxSections)
  const hiddenSectionCount = (issue.sections ?? []).length - sections.length

  if (view === 'grid') {
    const cover = issue.coverImage
      ? urlFor(issue.coverImage).width(480).height(360).fit('crop').auto('format').url()
      : null
    return (
      <li>
        <article className="group h-full rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
          <Link
            href={`/newsletter/${slug}`}
            className="relative block aspect-[4/3] bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
            aria-label={`Read NAVCOM: ${issue.title}`}
          >
            {cover ? (
              <Image
                src={cover}
                alt={altText}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                No cover image
              </div>
            )}
            {issue.featured ? (
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-eaa-yellow text-eaa-blue px-2.5 py-0.5 text-xs font-bold shadow">
                <span aria-hidden="true">★</span>
                <span>Featured</span>
              </span>
            ) : null}
          </Link>
          <div className="p-4 flex-1 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              <time dateTime={newsletterIssueIsoDate(issue.issueDate)}>
                {formatNewsletterIssueShortDate(issue.issueDate)}
              </time>
              {issue.volumeLabel ? <span className="text-gray-400"> · {issue.volumeLabel}</span> : null}
            </p>
            <h3 className="text-base font-bold text-eaa-blue mb-2 leading-snug">
              <Link
                href={`/newsletter/${slug}`}
                className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
              >
                {issue.title}
              </Link>
            </h3>
            {issue.excerpt ? (
              <p className="text-sm text-gray-600 line-clamp-3 mb-3">{issue.excerpt}</p>
            ) : null}
            {sections.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5 mb-3" aria-label="Sections in this issue">
                {sections.map((s) =>
                  s.slug?.current ? (
                    <li key={s._id}>
                      <Link
                        href={`/newsletter/sections/${s.slug.current}`}
                        className="inline-flex items-center rounded-full border border-eaa-blue/20 bg-blue-50 text-eaa-blue px-2 py-0.5 text-xs font-medium hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-1"
                      >
                        {s.title}
                      </Link>
                    </li>
                  ) : null
                )}
                {hiddenSectionCount > 0 ? (
                  <li className="text-xs font-medium text-gray-500 self-center">
                    +{hiddenSectionCount} more
                  </li>
                ) : null}
              </ul>
            ) : null}
            <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <Link
                href={`/newsletter/${slug}`}
                className="font-semibold text-eaa-light-blue hover:text-eaa-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
              >
                Read online
                <span aria-hidden="true"> →</span>
              </Link>
              {pdfHref ? (
                <a
                  href={pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-600 hover:text-eaa-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
                  aria-label={`Download PDF for ${issue.title} (opens in a new tab)`}
                >
                  PDF
                </a>
              ) : null}
            </div>
          </div>
        </article>
      </li>
    )
  }

  // List layout
  const cover = issue.coverImage
    ? urlFor(issue.coverImage).width(220).height(160).fit('crop').auto('format').url()
    : null
  return (
    <li>
      <article className="flex flex-col sm:flex-row gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
        {cover ? (
          <div className="relative h-36 w-full shrink-0 sm:w-44 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={cover}
              alt={altText}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 176px"
            />
            {issue.featured ? (
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-eaa-yellow text-eaa-blue px-2 py-0.5 text-[10px] font-bold shadow">
                <span aria-hidden="true">★</span>
                <span>Featured</span>
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">
            <time dateTime={newsletterIssueIsoDate(issue.issueDate)}>
              {formatNewsletterIssueDate(issue.issueDate)}
            </time>
            {issue.volumeLabel ? ` · ${issue.volumeLabel}` : ''}
            {typeof issue.pageCount === 'number' ? (
              <>
                {' · '}
                <span aria-label={`${issue.pageCount} pages`}>{issue.pageCount} pp</span>
              </>
            ) : null}
          </p>
          <h2 className="text-xl font-bold text-eaa-blue mb-2">
            <Link
              href={`/newsletter/${slug}`}
              className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
            >
              {issue.title}
              {issue.featured && !cover ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-eaa-yellow text-eaa-blue px-2 py-0.5 text-[11px] font-bold align-middle">
                  <span aria-hidden="true">★</span>
                  <span>Featured</span>
                </span>
              ) : null}
            </Link>
          </h2>
          {issue.excerpt ? (
            <p className="text-gray-700 text-sm mb-3 line-clamp-3">{issue.excerpt}</p>
          ) : null}
          {sections.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 mb-3" aria-label="Sections in this issue">
              {sections.map((s) =>
                s.slug?.current ? (
                  <li key={s._id}>
                    <Link
                      href={`/newsletter/sections/${s.slug.current}`}
                      className="inline-flex items-center rounded-full border border-eaa-blue/20 bg-blue-50 text-eaa-blue px-2 py-0.5 text-xs font-medium hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-1"
                    >
                      {s.title}
                    </Link>
                  </li>
                ) : null
              )}
              {hiddenSectionCount > 0 ? (
                <li className="text-xs font-medium text-gray-500 self-center">
                  +{hiddenSectionCount} more
                </li>
              ) : null}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={`/newsletter/${slug}`}
              className="font-semibold text-eaa-light-blue hover:text-eaa-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
            >
              Read online
              <span aria-hidden="true"> →</span>
            </Link>
            {pdfHref ? (
              <a
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-600 hover:text-eaa-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
                aria-label={`Download PDF for ${issue.title} (opens in a new tab)`}
              >
                PDF
              </a>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  )
}
