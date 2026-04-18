import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { SanityImageSource } from '@sanity/image-url'

type Props = {
  page: {
    heroImage?:
      | (SanityImageSource & {
          asset?: {
            metadata?: { dimensions?: { width?: number; height?: number; aspectRatio?: number } }
          }
        })
      | null
    heroImageAlt?: string | null
    pageTitle?: string | null
    tagline?: string | null
    intro?: string | null
  } | null
}

const FALLBACK_TITLE = 'NAVCOM newsletter'
const FALLBACK_TAGLINE = 'Navigation Communication — published monthly.'
const FALLBACK_INTRO =
  'NAVCOM is the official newsletter of EAA Chapter 690. Browse recent issues below — read each issue on the web or download the original PDF.'

export default function NewsletterPageHero({ page }: Props) {
  const title = page?.pageTitle?.trim() || FALLBACK_TITLE
  const tagline = page?.tagline?.trim() || FALLBACK_TAGLINE
  const intro = page?.intro?.trim() || FALLBACK_INTRO
  const heroImage = page?.heroImage ?? null
  const altText = page?.heroImageAlt?.trim() || ''

  const heroSrc = heroImage
    ? urlFor(heroImage).width(1600).height(640).fit('crop').auto('format').url()
    : null

  if (heroSrc) {
    return (
      <section className="relative isolate overflow-hidden rounded-2xl mb-10 shadow-md">
        <div className="absolute inset-0">
          <Image
            src={heroSrc}
            alt={altText}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          {/* Gradient overlay — non-decorative content sits on top with WCAG 1.4.3 contrast against this layer. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/30"
          />
        </div>
        <div className="relative px-6 py-14 sm:px-10 sm:py-20 max-w-3xl">
          <p className="text-eaa-yellow font-semibold tracking-wide uppercase text-xs sm:text-sm mb-2">
            EAA Chapter 690
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-white drop-shadow-sm mb-3">
            {title}
          </h1>
          <p className="text-white/90 text-lg font-medium mb-3">{tagline}</p>
          <p className="text-white/85 text-base max-w-2xl leading-relaxed">{intro}</p>
        </div>
      </section>
    )
  }

  return (
    <header className="mb-10">
      <p className="text-eaa-light-blue font-semibold tracking-wide uppercase text-xs sm:text-sm mb-2">
        EAA Chapter 690
      </p>
      <h1 className="font-display text-4xl sm:text-5xl text-eaa-blue mb-3">{title}</h1>
      <p className="text-gray-800 text-lg font-medium mb-2">{tagline}</p>
      <p className="text-gray-700 max-w-3xl leading-relaxed">{intro}</p>
    </header>
  )
}
