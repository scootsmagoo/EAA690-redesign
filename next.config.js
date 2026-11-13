/**
 * Old Squarespace URLs (docs/launch/squarespace-urls.txt) → their pages on this site.
 * Paths that already exist here with the same slug (/calendar, /contact, /kudos, /news,
 * /media/<gallery>, /store) need no entry. Still unmapped, pending the chapter:
 * /agenda, /slack, /spaghetti-rsvp (and the /blank-master template leftovers, which 404).
 */
const PROGRAM_SLUGS = [
  'aopa-teen-membership',
  'eagle-flights',
  'outreach',
  'scholarships',
  'summer-camp',
  'vmc-imc-club',
  'young-eagles',
  'youth-aviation-program',
]

/** Old top-level person pages → Kudos profile slugs in Sanity. */
const KUDOS_PAGES = {
  agudelo: 'stephen-agudelo',
  'alex-kirkland': 'alex-kirkland',
  'alex-short': 'alex-short',
  clement: 'zak-clement',
  haile: 'biya-haile',
  hale: 'maddie-hale',
  'harrison-curry': 'harrison-curry',
  'jeff-coffey': 'jeff-coffey',
  'josh-franklin': 'josh-franklin',
  klos: 'christian-klos',
  'luke-jordan': 'luke-jordan',
  'steve-hurst': 'steve-hurst',
}

/** Old store category pages. Listed explicitly: /store/cart and /store/success are real routes. */
const STORE_CATEGORIES =
  'memoriam|merchandise|name-tags|pancake-breakfast|spaghetti-dinner|special-events|summer-camp-fees'

const LEGACY_SQUARESPACE_REDIRECTS = [
  { source: '/home', destination: '/' },
  { source: '/board', destination: '/chapter/board' },
  { source: '/general-info', destination: '/chapter/general-info' },
  { source: '/visit', destination: '/chapter/visit-us' },
  { source: '/bylaws', destination: '/members/bylaws' },
  { source: '/hangar-rental', destination: '/members/hangar-rental' },
  { source: '/ground-school', destination: '/programs' },
  { source: '/events', destination: '/calendar' },
  { source: '/events/:path*', destination: '/calendar' },
  ...PROGRAM_SLUGS.map((slug) => ({ source: `/${slug}`, destination: `/programs/${slug}` })),
  ...Object.entries(KUDOS_PAGES).map(([oldSlug, slug]) => ({
    source: `/${oldSlug}`,
    destination: `/kudos/${slug}`,
  })),
  { source: '/maria-hernandez', destination: '/kudos' },
  { source: '/media/duane-huff-georgia-hall-of-fame-induction', destination: '/media/duane-huff-hall-of-fame-induction' },
  { source: '/media/video', destination: '/media' },
  // Store: memberships and donations have dedicated pages; everything else lands on /store.
  { source: '/store/memberships', destination: '/join' },
  { source: '/store/p/:slug(.*membership.*)', destination: '/join' },
  { source: '/store/donations', destination: '/donate' },
  { source: '/store/p/donations', destination: '/donate' },
  { source: `/store/:category(${STORE_CATEGORIES})`, destination: '/store' },
  { source: '/store/p/:slug', destination: '/store' },
].map((r) => ({ ...r, permanent: true }))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Expose deployment target to the browser for client-side environment checks.
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || '',
  },
  // Native modules: avoid bundling into serverless chunks.
  serverExternalPackages: ['better-sqlite3', 'pg'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/programs/ground-school',
        destination: '/programs',
        permanent: true,
      },
      {
        // Legacy duplicate of /sign-in (page removed).
        source: '/login',
        destination: '/sign-in',
        permanent: true,
      },
      ...LEGACY_SQUARESPACE_REDIRECTS,
    ]
  },
  async headers() {
    // In development, skip strict CSP/security headers. Chrome enforces CSP; embedded
    // IDE browsers often do not — so styles can appear in the IDE but look "unstyled"
    // in Chrome when Turbopack uses blob: or dev-only asset URLs that violate prod CSP.
    if (process.env.NODE_ENV === 'development') {
      return []
    }
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Clickjacking protection (belt + suspenders with CSP frame-ancestors)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Force HTTPS for 2 years (preload-eligible). Vercel sets this on its
          // domains automatically, but declaring it explicitly avoids drift on
          // future custom-domain configurations.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Limit referrer info sent to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Cross-origin isolation (mitigates Spectre-style cross-origin reads).
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // Disable unused browser features; allow payment= for Stripe Payment Request API
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "js.stripe.com")',
          },
          // Content Security Policy
          // Note: Next.js requires 'unsafe-inline' for its runtime scripts and styles.
          // A nonce-based CSP would be stricter but needs middleware; this is a solid baseline.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: cdn.sanity.io *.stripe.com",
              "font-src 'self' fonts.gstatic.com",
              // Stripe Checkout redirect is same-tab navigation (no fetch needed), but
              // Stripe.js (if added later) needs connect-src; include now for forward compat.
              "connect-src 'self' *.sanity.io api.sanity.io *.supabase.co api.stripe.com calendar.google.com",
              "frame-src 'self' *.sanity.io js.stripe.com hooks.stripe.com www.youtube-nocookie.com player.vimeo.com www.google.com calendar.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              // checkout.stripe.com redirect is a GET, not a form POST — 'self' is sufficient
              "form-action 'self'",
              // Block <object>/<embed>/<applet> outright (no legitimate use here).
              "object-src 'none'",
              // Auto-upgrade any stray http:// subresources to https:// (defense-in-depth with HSTS).
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
      {
        // Override Referrer-Policy for the password reset page only. The token lives in the
        // query string, and `no-referrer` is the only setting that guarantees that URL never
        // leaves the browser in any outbound Referer header (the default
        // `strict-origin-when-cross-origin` still sends the full URL on same-origin requests).
        // Next.js applies the LAST matching `headers` entry per header key, so this must come
        // after the catch-all block above to actually win the precedence battle.
        source: '/reset-password',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
