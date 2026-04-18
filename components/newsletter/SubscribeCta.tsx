type Props = {
  blurb?: string | null
}

const FALLBACK_BLURB =
  'Want NAVCOM in your inbox each month? Subscribe to our chapter mailing list — no spam, just aviation.'

/**
 * In-page Subscribe CTA. Routes to the existing footer signup form so we don't
 * duplicate the form (and its rate limiting / honeypot / Mailchimp wiring).
 *
 * The footer form anchors via `id="footer-newsletter-signup"`, which we set on
 * the Footer component. Clicking the CTA scrolls to that anchor and focuses
 * the email input.
 */
export default function SubscribeCta({ blurb }: Props) {
  const text = blurb?.trim() || FALLBACK_BLURB
  return (
    <aside
      aria-labelledby="navcom-subscribe-heading"
      className="my-12 rounded-2xl border border-eaa-yellow/40 bg-gradient-to-br from-eaa-yellow/15 to-blue-50 px-6 py-7 sm:px-8 sm:py-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex-1">
          <h2
            id="navcom-subscribe-heading"
            className="text-xl sm:text-2xl font-bold text-eaa-blue mb-1"
          >
            Get NAVCOM by email
          </h2>
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed max-w-2xl">{text}</p>
        </div>
        <a
          href="#footer-newsletter-signup"
          className="inline-flex items-center justify-center rounded-full bg-eaa-blue text-white px-6 py-2.5 text-sm font-bold hover:bg-eaa-light-blue transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
        >
          Subscribe
          <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </aside>
  )
}
