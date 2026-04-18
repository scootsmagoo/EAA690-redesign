import { formatPdfSize, getNewsletterIssuePdfHref } from '@/lib/newsletter'

type Props = {
  issue: {
    title: string
    pageCount?: number
    pdf?: { asset?: { url?: string; size?: number; originalFilename?: string } | null } | null
    pdfUrl?: string | null
  }
}

/**
 * Server-rendered "PDF actions" panel for the issue detail page.
 *
 * Web-first strategy: the PDF is presented as the high-fidelity download
 * fallback, not embedded inline. Keeps initial bundle small, avoids tracking
 * pixels from third-party PDF viewers, and stays accessible (screen readers
 * announce a regular link rather than an opaque <object> region).
 */
export default function IssuePdfPanel({ issue }: Props) {
  const pdfHref = getNewsletterIssuePdfHref(issue)
  if (!pdfHref) return null

  // Only Sanity-hosted PDFs expose a known size; external (Drive) links don't.
  const pdfSize = formatPdfSize(issue.pdf?.asset?.size)
  const isExternal = !issue.pdf?.asset?.url
  const filename =
    issue.pdf?.asset?.originalFilename?.trim() ||
    `NAVCOM-${issue.title.replace(/\s+/g, '-')}.pdf`

  return (
    <aside
      aria-labelledby="navcom-pdf-panel-heading"
      className="not-prose mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 inline-flex items-center justify-center rounded-lg bg-eaa-blue/10 text-eaa-blue h-12 w-12"
          aria-hidden="true"
        >
          <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            <path d="M11 2v4a1 1 0 001 1h4" fill="white" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="navcom-pdf-panel-heading" className="text-base font-bold text-eaa-blue">
            Original PDF
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Read the high-fidelity NAVCOM layout exactly as published.
            {pdfSize ? <> <span className="text-gray-400">·</span> {pdfSize}</> : null}
            {typeof issue.pageCount === 'number' ? (
              <>
                {' '}
                <span className="text-gray-400">·</span> {issue.pageCount} pages
              </>
            ) : null}
            {isExternal ? (
              <>
                {' '}
                <span className="text-gray-400">·</span> External (Google Drive)
              </>
            ) : null}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-eaa-blue text-white px-5 py-2 text-sm font-bold hover:bg-eaa-light-blue transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
              aria-label={`Open NAVCOM PDF for ${issue.title} in a new tab`}
            >
              Open PDF
              <span className="sr-only"> (opens in a new tab)</span>
              <svg className="ml-1.5 h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
            {!isExternal ? (
              <a
                href={pdfHref}
                download={filename}
                className="inline-flex items-center justify-center rounded-full border-2 border-eaa-blue text-eaa-blue px-5 py-2 text-sm font-bold hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
              >
                Download
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  )
}
