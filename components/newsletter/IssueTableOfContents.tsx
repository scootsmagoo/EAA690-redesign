import Link from 'next/link'
import {
  getNewsletterIssuePdfHrefWithPage,
  safeTocExternalUrl,
  type NewsletterTocItem,
} from '@/lib/newsletter'

type Props = {
  items?: NewsletterTocItem[] | null
  issue: {
    pdf?: { asset?: { url?: string } | null } | null
    pdfUrl?: string | null
  }
  /** Used as the accessible heading for the <nav> element. */
  headingId?: string
}

/**
 * Renders an editor-curated table of contents for a NAVCOM issue.
 *
 * Resolution order for each entry's link target:
 *   1. `externalUrl` — validated via `safeTocExternalUrl` (allow same-site
 *      paths or absolute http(s); blocks `javascript:`, `data:`, etc.)
 *   2. `pageNumber` — appends `#page=N` to the issue's PDF when available.
 *   3. Plain text — entry remains read-only (no link).
 */
export default function IssueTableOfContents({ items, issue, headingId = 'navcom-toc' }: Props) {
  const list = (items ?? []).filter((i) => i?.heading?.trim())
  if (list.length === 0) return null

  return (
    <nav
      aria-labelledby={headingId}
      className="mb-10 rounded-xl border border-eaa-blue/15 bg-blue-50/40 p-5 sm:p-6"
    >
      <h2 id={headingId} className="text-sm font-bold uppercase tracking-wide text-eaa-blue mb-3">
        In this issue
      </h2>
      <ol className="divide-y divide-eaa-blue/10">
        {list.map((item, idx) => {
          const safeExternal = safeTocExternalUrl(item.externalUrl)
          const pdfHref = getNewsletterIssuePdfHrefWithPage(issue, item.pageNumber)
          const href =
            safeExternal ??
            (typeof item.pageNumber === 'number' && pdfHref ? pdfHref : null)
          const isExternal =
            href !== null && (safeExternal !== null || (pdfHref !== null && href === pdfHref))
          const sectionTitle = item.section?.title?.trim()
          const sectionSlug = item.section?.slug?.current?.trim()
          const sectionMeta =
            sectionTitle && sectionSlug ? (
              <Link
                href={`/newsletter/sections/${sectionSlug}`}
                className="ml-2 inline-flex items-center rounded-full border border-eaa-blue/20 bg-white text-eaa-blue px-2 py-0.5 text-xs font-medium hover:bg-blue-100 align-middle focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-1"
              >
                §&nbsp;{sectionTitle}
              </Link>
            ) : sectionTitle ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-white text-eaa-blue/80 px-2 py-0.5 text-xs font-medium align-middle">
                §&nbsp;{sectionTitle}
              </span>
            ) : null

          return (
            <li key={idx} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline gap-3">
                {typeof item.pageNumber === 'number' ? (
                  <span
                    className="shrink-0 inline-flex items-center justify-center rounded-md bg-white border border-eaa-blue/20 text-eaa-blue text-xs font-bold tabular-nums px-2 py-0.5 min-w-[2.25rem]"
                    aria-label={`Page ${item.pageNumber}`}
                  >
                    p.&nbsp;{item.pageNumber}
                  </span>
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline">
                    {href ? (
                      <a
                        href={href}
                        {...(isExternal
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="font-semibold text-eaa-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
                      >
                        {item.heading}
                        {isExternal ? (
                          <span className="sr-only"> (opens in a new tab)</span>
                        ) : null}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-800">{item.heading}</span>
                    )}
                    {sectionMeta}
                  </div>
                  {item.summary?.trim() ? (
                    <p className="text-sm text-gray-600 mt-0.5">{item.summary}</p>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
