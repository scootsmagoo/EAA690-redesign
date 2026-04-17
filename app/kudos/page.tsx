import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getKudos, getKudosPage, urlFor } from '@/lib/sanity'

/** No ISR cache: editors expect Sanity edits to show without waiting (matches /news, /media). */
export const revalidate = 0

// Default copy used when no kudosPage singleton has been published yet.
const DEFAULT_TITLE = 'Kudos'
const DEFAULT_TAGLINE = 'It all begins with a spark…'
const DEFAULT_INTRO =
  'EAA 690 has a long history of successes — both seasoned pilots and students alike. We’d like to toot our own horn a bit and share them here.'
const DEFAULT_DESCRIPTION =
  'Recognizing the pilots, students, scholars, and chapter members of EAA 690 who have achieved milestones in aviation.'

type KudosCard = {
  _id: string
  name: string
  slug?: { current?: string | null } | null
  achievement?: string | null
  date?: string | null
  excerpt?: string | null
  featuredImage?: unknown
  hasGallery?: boolean
  galleryCount?: number
}

type KudosPageContent = {
  heroImage?: unknown
  heroImageAlt?: string | null
  pageTitle?: string | null
  tagline?: string | null
  intro?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
} | null

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  // Date-only ISO strings are interpreted as UTC midnight, which can shift to
  // the previous day in negative offsets. Anchor at noon to keep the intended day.
  const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export async function generateMetadata(): Promise<Metadata> {
  let pageContent: KudosPageContent = null
  try {
    pageContent = await getKudosPage()
  } catch {
    pageContent = null
  }
  const title = pageContent?.seoTitle?.trim() || `${pageContent?.pageTitle?.trim() || DEFAULT_TITLE} | EAA 690`
  const description = pageContent?.seoDescription?.trim() || DEFAULT_DESCRIPTION
  return {
    title,
    description,
    alternates: { canonical: '/kudos' },
    openGraph: {
      title,
      description,
      type: 'website',
      url: '/kudos',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function KudosPage() {
  let kudosList: KudosCard[] = []
  let pageContent: KudosPageContent = null

  // Fetch in parallel; gracefully degrade to empty state if Sanity is unreachable.
  const [kudosResult, pageResult] = await Promise.allSettled([getKudos(), getKudosPage()])

  if (kudosResult.status === 'fulfilled' && Array.isArray(kudosResult.value)) {
    kudosList = kudosResult.value as KudosCard[]
  }
  if (pageResult.status === 'fulfilled') {
    pageContent = pageResult.value as KudosPageContent
  }

  const pageTitle = pageContent?.pageTitle?.trim() || DEFAULT_TITLE
  const tagline = pageContent?.tagline?.trim() || DEFAULT_TAGLINE
  const intro = pageContent?.intro?.trim() || DEFAULT_INTRO

  // Hero image (optional, CMS-managed). Alt text is required by the schema when an image is set.
  const heroImageUrl = pageContent?.heroImage
    ? urlFor(pageContent.heroImage as Parameters<typeof urlFor>[0])
        .width(2000)
        .fit('max')
        .url()
    : null
  const heroImageAlt = pageContent?.heroImageAlt?.trim() || ''

  return (
    <div>
      {heroImageUrl ? (
        <div className="w-full">
          <Image
            src={heroImageUrl}
            alt={heroImageAlt}
            width={2000}
            height={900}
            className="w-full h-auto block"
            priority
            sizes="100vw"
          />
        </div>
      ) : null}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-eaa-blue mb-4">{pageTitle}</h1>
          <p className="text-lg text-gray-700 italic font-semibold uppercase tracking-wide">
            {tagline}
          </p>
          <p className="mt-3 text-gray-700 max-w-3xl">{intro}</p>
        </header>

        {kudosList.length > 0 ? (
          <ul aria-label="Kudos recipients" className="space-y-8 list-none p-0">
            {kudosList.map((kudo) => {
              const imageUrl = kudo.featuredImage
                ? urlFor(kudo.featuredImage as Parameters<typeof urlFor>[0])
                    .width(400)
                    .height(300)
                    .fit('crop')
                    .url()
                : null
              const slug = kudo.slug?.current?.trim() || null
              const detailHref = slug ? `/kudos/${slug}` : null
              const titleId = `kudo-${kudo._id}`
              const formattedDate = formatDate(kudo.date)
              const detailLabel = `Read the full story for ${kudo.name}`
              const galleryLabel = `View photo gallery for ${kudo.name}`

              return (
                <li key={kudo._id}>
                  <article
                    aria-labelledby={titleId}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col sm:flex-row"
                  >
                    {imageUrl ? (
                      <div className="sm:w-56 sm:shrink-0 relative">
                        <Image
                          src={imageUrl}
                          alt={`${kudo.name}${kudo.achievement ? ` — ${kudo.achievement}` : ''}`}
                          width={400}
                          height={300}
                          className="w-full h-48 sm:h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="sm:w-56 sm:shrink-0 bg-eaa-blue/10 flex items-center justify-center h-48 sm:h-auto"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-16 h-16 text-eaa-blue/40"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}

                    <div className="p-6 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                          <h2 id={titleId} className="text-xl font-bold text-eaa-blue">
                            {detailHref ? (
                              <Link
                                href={detailHref}
                                aria-label={detailLabel}
                                className="hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
                              >
                                {kudo.name}
                              </Link>
                            ) : (
                              kudo.name
                            )}
                          </h2>
                          {formattedDate && kudo.date ? (
                            <time
                              dateTime={kudo.date}
                              className="text-sm text-gray-600 shrink-0"
                            >
                              {formattedDate}
                            </time>
                          ) : null}
                        </div>
                        {kudo.achievement ? (
                          <p className="text-eaa-light-blue font-semibold text-sm mb-3">
                            {kudo.achievement}
                          </p>
                        ) : null}
                        {kudo.excerpt ? (
                          <p className="text-gray-700 text-sm leading-relaxed">{kudo.excerpt}</p>
                        ) : null}
                      </div>

                      {detailHref ? (
                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                          <Link
                            href={detailHref}
                            aria-label={detailLabel}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-eaa-light-blue hover:text-eaa-blue transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
                          >
                            See Full Story
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                          {kudo.hasGallery ? (
                            <Link
                              href={`${detailHref}#gallery`}
                              aria-label={galleryLabel}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-eaa-blue transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {typeof kudo.galleryCount === 'number' && kudo.galleryCount > 0
                                ? `More Photos (${kudo.galleryCount})`
                                : 'More Photos'}
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center"
          >
            <p className="text-gray-700">
              No kudos have been published yet. Check back soon — or{' '}
              <Link
                href="/contact"
                className="text-eaa-light-blue font-semibold hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
              >
                nominate someone
              </Link>{' '}
              for recognition.
            </p>
          </div>
        )}

        <aside className="mt-14 bg-blue-50 border border-blue-100 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-eaa-blue mb-2">Nominate Someone</h2>
          <p className="text-gray-700">
            Know someone who deserves recognition?{' '}
            <Link
              href="/contact"
              className="text-eaa-light-blue font-semibold hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
            >
              Contact us
            </Link>{' '}
            to nominate them for kudos.
          </p>
        </aside>
      </div>
    </div>
  )
}
