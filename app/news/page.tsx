import { resolvedNavcomArchiveFolderUrl } from '@/lib/newsletter'
import { getNewsArticles, getNewsPage, getSiteSettings, urlFor } from '@/lib/sanity'
import type { NewsArticle } from '@/lib/sanity-types'
import Link from 'next/link'
import Image from 'next/image'

/** Dynamic: avoid stale listing after CMS publishes (ISR was caching HTML for minutes). */
export const revalidate = 0

// Fallback data when Sanity isn't configured
const fallbackNews: NewsArticle[] = [
  {
    _id: 'fallback-1',
    title: 'February Pancake Breakfast Speaker Announced',
    slug: { current: 'february-2026-speaker' },
    publishedAt: '2026-02-01T00:00:00Z',
    excerpt: 'Steve Ashby will present "What it\'s like to be an Aviation Magazine Writer" at our February 6th breakfast program.',
  },
  {
    _id: 'fallback-2',
    title: 'Breakfast Price Update',
    slug: { current: 'breakfast-price-update' },
    publishedAt: '2025-11-15T00:00:00Z',
    excerpt: 'Please note that breakfast prices have increased to $10/each. We appreciate your continued support!',
  },
  {
    _id: 'fallback-3',
    title: 'Gold Chapter Status Maintained',
    slug: { current: 'gold-chapter-status-2025' },
    publishedAt: '2025-10-20T00:00:00Z',
    excerpt: 'EAA 690 has once again achieved Gold Chapter status, recognizing our commitment to promoting aviation.',
  },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function NewsPage() {
  // Try to fetch from Sanity, fall back to hardcoded data
  let newsItems: NewsArticle[] = fallbackNews
  let heroImageSrc = '/images/news-hero.jpg'
  let heroImageAlt = 'EAA 690 members and aircraft at Briscoe Field'

  try {
    const newsPageData = await getNewsPage()
    if (newsPageData?.heroImage) {
      heroImageSrc = urlFor(newsPageData.heroImage).width(2000).fit('max').url()
    }
    if (newsPageData?.heroImageAlt?.trim()) {
      heroImageAlt = newsPageData.heroImageAlt.trim()
    }
  } catch {
    // Sanity not configured or error — use static fallback
  }

  try {
    const sanityNews = await getNewsArticles()
    if (sanityNews && sanityNews.length > 0) {
      newsItems = sanityNews
    }
  } catch (error) {
    // Sanity not configured or error - use fallback
    console.log('Using fallback news (Sanity not configured)')
  }

  let legacyArchiveUrl = resolvedNavcomArchiveFolderUrl(undefined)
  try {
    const settings = (await getSiteSettings()) as { newsletterArchiveFolderUrl?: string } | null
    legacyArchiveUrl = resolvedNavcomArchiveFolderUrl(settings?.newsletterArchiveFolderUrl)
  } catch {
    // keep default Drive URL from resolvedNavcomArchiveFolderUrl
  }

  return (
    <div>
      <div className="w-full">
        <Image
          src={heroImageSrc}
          alt={heroImageAlt}
          width={2000}
          height={1094}
          className="w-full h-auto block"
          priority
          sizes="100vw"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-eaa-blue mb-8">News</h1>

      <div className="space-y-8">
        {newsItems.map((item) => (
          <article key={item._id} aria-labelledby={`news-title-${item._id}`} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <time
                className="text-sm text-gray-500"
                dateTime={item.publishedAt}
                title={formatDate(item.publishedAt)}
              >
                {formatDate(item.publishedAt)}
              </time>
              {item.author && (
                <span className="text-sm text-gray-500">By {item.author}</span>
              )}
            </div>
            <h2 id={`news-title-${item._id}`} className="text-2xl font-bold text-eaa-blue mb-3">
              {item.slug?.current ? (
                <Link
                  href={`/news/${item.slug.current}`}
                  className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
                >
                  {item.title}
                </Link>
              ) : (
                item.title
              )}
            </h2>
            {item.excerpt && (
              <p className="text-gray-700">{item.excerpt}</p>
            )}
          </article>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-eaa-blue mb-4">Stay Updated</h2>
        <p className="text-gray-700 mb-4">
          For the latest news and updates, be sure to check our{' '}
          <Link
            href="/newsletter"
            className="text-eaa-light-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
          >
            NAVCOM newsletter
          </Link>{' '}
          and follow us on social media.
        </p>
      </div>

      <aside
        aria-labelledby="navcom-archive-callout"
        className="mt-8 rounded-lg border border-blue-100 bg-blue-50/80 p-6"
      >
        <h2 id="navcom-archive-callout" className="text-xl font-bold text-eaa-blue mb-2">
          Full NAVCOM archive
        </h2>
        <p className="text-gray-700 mb-4">
          Looking for older chapter news? Our complete historical NAVCOM newsletter archive — going back
          decades — lives in a public Google Drive folder (organized by year). Anything not yet imported into
          this site can be found there.
        </p>
        <a
          href={legacyArchiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-eaa-light-blue hover:text-eaa-blue underline focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
        >
          Open full NAVCOM archive (Google Drive)
          <span className="sr-only"> (opens in a new tab)</span>
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      </aside>
      </div>
    </div>
  )
}
