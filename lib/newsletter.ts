import type { SanityImageSource } from '@sanity/image-url'
import { isSafeSiteHref } from '@/lib/search-safety'

/** Reference to a NAVCOM section, as projected by GROQ. */
export type NewsletterSectionRef = {
  _id: string
  title?: string
  slug?: { current?: string }
}

/** A single Table-of-Contents row, as projected by GROQ. */
export type NewsletterTocItem = {
  heading?: string
  pageNumber?: number
  summary?: string
  externalUrl?: string
  section?: NewsletterSectionRef | null
}

/** Issue row used for archive cards and listings. */
export type NewsletterIssueListRow = {
  _id: string
  title: string
  slug: { current?: string }
  issueDate?: string
  volumeLabel?: string
  pageCount?: number
  featured?: boolean
  excerpt?: string
  coverImage?: SanityImageSource | null
  coverImageAlt?: string | null
  sections?: NewsletterSectionRef[] | null
  pdf?: { asset?: { url?: string; originalFilename?: string; size?: number } | null } | null
  pdfUrl?: string | null
}

/** Resolved PDF for a NAVCOM issue (uploaded asset or external URL). */
export function getNewsletterIssuePdfHref(issue: {
  pdf?: { asset?: { url?: string; originalFilename?: string } | null } | null
  pdfUrl?: string | null
} | null): string | null {
  const fromAsset = issue?.pdf?.asset?.url
  if (fromAsset) return fromAsset
  const external = issue?.pdfUrl?.trim()
  if (external) return external
  return null
}

/**
 * "Open at page N" link for a PDF, when the viewer supports the PDF Open
 * Parameters fragment (Chrome, Firefox, Safari, Edge all do; Drive viewer ignores it
 * gracefully). Falls back to the plain href if no page is supplied.
 */
export function getNewsletterIssuePdfHrefWithPage(
  issue: {
    pdf?: { asset?: { url?: string } | null } | null
    pdfUrl?: string | null
  } | null,
  pageNumber: number | undefined
): string | null {
  const base = getNewsletterIssuePdfHref(issue)
  if (!base) return null
  if (!pageNumber || !Number.isFinite(pageNumber) || pageNumber < 1) return base
  // Don't add #page= to URLs that already have a fragment (e.g. Drive share links).
  if (base.includes('#')) return base
  return `${base}#page=${Math.floor(pageNumber)}`
}

export function formatNewsletterIssueDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Compact "Apr 2026" label for cards / metadata where space is tight. */
export function formatNewsletterIssueShortDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/** ISO 8601 date for <time dateTime=…> elements (avoids locale ambiguity). */
export function newsletterIssueIsoDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

export function issueYear(iso: string | undefined): number | null {
  if (!iso) return null
  const y = new Date(iso).getFullYear()
  return Number.isNaN(y) ? null : y
}

/**
 * Build the public URL for an issue. Used for share buttons, RSS, JSON-LD.
 * Returns absolute URL when `baseUrl` is provided; otherwise a relative path.
 */
export function getNewsletterIssueUrl(slug: string | undefined, baseUrl?: string): string | null {
  const safe = (slug ?? '').trim()
  if (!safe) return null
  const path = `/newsletter/${encodeURIComponent(safe)}`
  if (!baseUrl) return path
  try {
    const u = new URL(path, baseUrl)
    return u.toString()
  } catch {
    return path
  }
}

/**
 * Validates a URL coming out of the CMS for a Table-of-Contents entry.
 * Same posture as Portable Text link annotations: allow same-site paths and
 * absolute http(s) URLs only.
 */
export function safeTocExternalUrl(href: string | undefined | null): string | null {
  if (!href) return null
  const trimmed = href.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) {
    return isSafeSiteHref(trimmed) ? trimmed : null
  }
  try {
    const u = new URL(trimmed)
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
  } catch {
    return null
  }
  return null
}

/** Pretty file size ("1.4 MB"). Returns empty string when unknown. */
export function formatPdfSize(bytes: number | undefined | null): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  const rounded = n >= 10 || i === 0 ? Math.round(n) : Math.round(n * 10) / 10
  return `${rounded} ${units[i]}`
}
