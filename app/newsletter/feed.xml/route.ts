import { getNewsletterIssues } from '@/lib/sanity'
import {
  getNewsletterIssuePdfHref,
  getNewsletterIssueUrl,
  type NewsletterIssueListRow,
} from '@/lib/newsletter'
import { getSiteBaseURL } from '@/lib/site-url'

export const revalidate = 600
export const dynamic = 'force-static'

const FEED_TITLE = 'NAVCOM — EAA Chapter 690 newsletter'
const FEED_DESCRIPTION =
  'New monthly issues of NAVCOM (Navigation Communication), the EAA Chapter 690 newsletter, with chapter news, programs, and member stories.'
const MAX_ITEMS = 50

/**
 * RFC 822 (RSS 2.0 pubDate) date.
 */
function rfc822(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toUTCString()
}

/**
 * Escape characters that are unsafe inside XML PCDATA / attribute values
 * (defense-in-depth — issue titles and excerpts come from CMS authors).
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(value: string): string {
  // CDATA can't contain `]]>`; split it if present.
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

export async function GET() {
  const baseUrl = getSiteBaseURL().replace(/\/+$/, '')
  let issues: NewsletterIssueListRow[] = []
  try {
    const raw = await getNewsletterIssues()
    issues = Array.isArray(raw) ? (raw as NewsletterIssueListRow[]) : []
  } catch {
    issues = []
  }

  const trimmed = issues.slice(0, MAX_ITEMS)
  const buildDate = new Date().toUTCString()
  const feedSelf = `${baseUrl}/newsletter/feed.xml`
  const feedHtml = `${baseUrl}/newsletter`

  const itemsXml = trimmed
    .map((issue) => {
      const slug = issue.slug?.current
      if (!slug) return ''
      const link = getNewsletterIssueUrl(slug, baseUrl) ?? feedHtml
      const pubDate = rfc822(issue.issueDate)
      const description = issue.excerpt?.trim() || `NAVCOM — ${issue.title}`
      const pdfHref = getNewsletterIssuePdfHref(issue)
      const enclosure = pdfHref
        ? `\n      <enclosure url="${escapeXml(pdfHref)}" type="application/pdf"${
            typeof issue.pdf?.asset?.size === 'number' ? ` length="${issue.pdf.asset.size}"` : ''
          } />`
        : ''
      const sectionCats = (issue.sections ?? [])
        .filter((s) => s?.title)
        .map((s) => `      <category>${escapeXml(s!.title!)}</category>`)
        .join('\n')
      return `    <item>
      <title>${cdata(issue.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      <description>${cdata(description)}</description>${enclosure}
${sectionCats}
    </item>`
    })
    .filter(Boolean)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(feedHtml)}</link>
    <atom:link href="${escapeXml(feedSelf)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>EAA Chapter 690 site</generator>
${itemsXml}
  </channel>
</rss>
`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // 10 minute browser cache, 1 hour CDN cache, serve stale while revalidating.
      'Cache-Control':
        'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
