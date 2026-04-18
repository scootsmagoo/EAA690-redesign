import type { Metadata } from 'next'

/**
 * `/reset-password` is reached via a one-time token in the query string. We don't want it in
 * any search index, archive cache, or AI crawler dataset — even if someone accidentally pastes
 * the link somewhere indexable. The `noarchive`/`nosnippet` directives stop crawlers that
 * already saw the URL from displaying or caching it.
 *
 * Per-page Referrer-Policy override is set in next.config.js (no-referrer for this route),
 * which is stricter than the site default of strict-origin-when-cross-origin and ensures
 * the token-bearing URL never appears in any outbound Referer header.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-snippet': 0,
      'max-image-preview': 'none',
    },
  },
  title: 'Reset password',
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
