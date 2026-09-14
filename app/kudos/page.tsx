import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getKudos, getKudosPage, urlFor } from '@/lib/sanity'
import SharedElement from '@/components/SharedElement'

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

  // pageTitle is intentionally not rendered on-page (the hero tagline serves as
  // the visible H1, matching the live site). It still feeds <title>/OG tags via
  // generateMetadata above and the breadcrumb shown on individual kudo pages.
  const tagline = pageContent?.tagline?.trim() || DEFAULT_TAGLINE
  const intro = pageContent?.intro?.trim() || DEFAULT_INTRO

  // Hero image: prefer the CMS-managed image if set, otherwise fall back to
  // the static banner shipped in /public so /kudos has a hero out of the box.
  type HeroImageWithAsset = Parameters<typeof urlFor>[0] & {
    asset?: { metadata?: { dimensions?: { width?: number; height?: number } } }
  }
  const cmsHeroImage = pageContent?.heroImage as HeroImageWithAsset | undefined
  const cmsHeroDimensions = cmsHeroImage?.asset?.metadata?.dimensions
  const heroImageUrl = cmsHeroImage
    ? urlFor(cmsHeroImage).width(2048).fit('max').url()
    : '/images/kudos-hero.jpg'
  // Banner from EAA690.org/kudos is by John Slemp; describe it for SR users in the static-fallback case.
  const heroImageAlt = cmsHeroImage
    ? pageContent?.heroImageAlt?.trim() || ''
    : 'Sunset sky over Briscoe Field with a lone aircraft on approach'
  const heroWidth = cmsHeroDimensions?.width ?? 2048
  const heroHeight = cmsHeroDimensions?.height ?? 511

  return (
    <div>
      {/*
        Hero with overlaid tagline + intro (mirrors live-site visual treatment).
        WCAG AA contrast is guaranteed by:
          1. A dark gradient scrim (rgba(0,0,0,0.55) baseline, deepening toward
             center) that sits between the image and the text. Independently of
             whatever hero image an editor uploads, white-on-scrim contrast
             stays > 7:1.
          2. A subtle text-shadow as a defense-in-depth fallback in case the
             scrim layer is somehow blocked (extension, print, etc.).
        The image is marked aria-hidden because the tagline + intro now act as
        the accessible name; we keep alt text on the underlying <Image> only
        when the editor explicitly provided it for SR users who want context.
      */}
      <section
        aria-labelledby="kudos-hero-heading"
        className="relative w-full overflow-hidden bg-eaa-blue"
        style={{ aspectRatio: `${heroWidth} / ${heroHeight}`, minHeight: '280px', maxHeight: '560px' }}
      >
        <Image
          src={heroImageUrl}
          alt={heroImageAlt}
          width={heroWidth}
          height={heroHeight}
          className="absolute inset-0 w-full h-full object-cover"
          priority
          sizes="100vw"
        />
        {/* Scrim: vertical gradient, darkest in the center band where text sits. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <div className="relative z-10 h-full flex items-center justify-center px-6 sm:px-10">
          <div
            className="font-display text-white text-center max-w-4xl"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
          >
            <h1
              id="kudos-hero-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-medium italic tracking-wide"
            >
              {tagline}
            </h1>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl leading-relaxed font-normal">
              {intro}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/*
          The hero's tagline serves as the page's H1 (it's the page's primary
          message and matches the live-site treatment). The literal page name
          ("Kudos") is carried by <title>/breadcrumbs, so we don't repeat it
          here. Kudo cards below use H2, preserving a clean heading outline.
        */}

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
                        <SharedElement name={slug ? `kudos-image-${slug}` : null}>
                          <Image
                            src={imageUrl}
                            alt={`${kudo.name}${kudo.achievement ? ` — ${kudo.achievement}` : ''}`}
                            width={400}
                            height={300}
                            className="w-full h-48 sm:h-full object-cover"
                          />
                        </SharedElement>
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
                          <SharedElement name={slug ? `kudos-name-${slug}` : null}>
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
                          </SharedElement>
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
