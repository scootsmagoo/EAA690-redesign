import Link from 'next/link'
import { formatNewsletterIssueShortDate } from '@/lib/newsletter'

type Adjacent = {
  _id: string
  title: string
  slug: { current?: string }
  issueDate?: string
  volumeLabel?: string
} | null

type Props = {
  previous: Adjacent
  next: Adjacent
}

export default function IssuePrevNext({ previous, next }: Props) {
  if (!previous && !next) return null

  return (
    <nav
      aria-label="Adjacent NAVCOM issues"
      className="not-prose mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden"
    >
      {previous?.slug?.current ? (
        <Link
          href={`/newsletter/${previous.slug.current}`}
          rel="prev"
          className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-eaa-blue/50 hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.707 4.293a1 1 0 00-1.414 0l-5 5a1 1 0 000 1.414l5 5a1 1 0 001.414-1.414L8.414 10l4.293-4.293a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Previous issue
          </span>
          <p className="mt-1 text-base font-bold text-eaa-blue group-hover:underline">
            {previous.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNewsletterIssueShortDate(previous.issueDate)}
            {previous.volumeLabel ? ` · ${previous.volumeLabel}` : ''}
          </p>
        </Link>
      ) : (
        <div aria-hidden="true" />
      )}
      {next?.slug?.current ? (
        <Link
          href={`/newsletter/${next.slug.current}`}
          rel="next"
          className="group rounded-xl border border-gray-200 bg-white p-4 sm:text-right hover:border-eaa-blue/50 hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 inline-flex items-center gap-1 sm:flex-row-reverse">
            Newer issue
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
          <p className="mt-1 text-base font-bold text-eaa-blue group-hover:underline">
            {next.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNewsletterIssueShortDate(next.issueDate)}
            {next.volumeLabel ? ` · ${next.volumeLabel}` : ''}
          </p>
        </Link>
      ) : (
        <div aria-hidden="true" />
      )}
    </nav>
  )
}
