import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PortableText } from '@portabletext/react'
import {
  getMediaGalleryBySlug,
  getMediaGallerySlugs,
} from '@/lib/sanity'
import { safePortableTextLinkHref } from '@/lib/search-safety'
import type { MediaGallery, MediaGalleryImage } from '@/lib/sanity-types'
import MediaSlideshowCarousel from '@/components/MediaSlideshowCarousel'
import MediaImageGrid from '@/components/MediaImageGrid'
import MediaVideoEmbed from '@/components/MediaVideoEmbed'

export const revalidate = 0

export async function generateStaticParams() {
  try {
    const rows = await getMediaGallerySlugs()
    return (rows ?? [])
      .filter((r: { slug?: string }) => Boolean(r.slug))
      .map((r: { slug: string }) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const gallery: MediaGallery | null = await getMediaGalleryBySlug(slug)
    if (!gallery) return { title: 'Media | EAA 690' }
    return {
      title: `${gallery.title} | EAA 690`,
      description: gallery.description ?? 'EAA 690 media gallery.',
    }
  } catch {
    return { title: 'Media | EAA 690' }
  }
}

function hasImageAsset(img: MediaGalleryImage | null | undefined): img is MediaGalleryImage {
  return typeof img?.asset?._ref === 'string' && img.asset._ref.length > 0
}

/** Shared PortableText component config (mirrors news article style). */
const richDescriptionComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl font-bold text-eaa-blue mt-6 mb-2">{children}</h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4 className="text-lg font-semibold text-eaa-blue mt-4 mb-1">{children}</h4>
    ),
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">{children}</ul>
    ),
    number: ({ children }: { children?: ReactNode }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong>{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em>{children}</em>,
    link: ({
      children,
      value,
    }: {
      children?: ReactNode
      value?: { href?: string }
    }) => {
      const safe = safePortableTextLinkHref(value?.href)
      if (!safe) {
        return <span className="underline decoration-gray-400">{children}</span>
      }
      if (safe.startsWith('http://') || safe.startsWith('https://')) {
        return (
          <a
            href={safe}
            className="text-eaa-blue underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        )
      }
      return (
        <Link
          href={safe}
          className="text-eaa-blue underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
        >
          {children}
        </Link>
      )
    },
  },
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function MediaGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let gallery: MediaGallery | null = null
  try {
    gallery = await getMediaGalleryBySlug(slug)
  } catch {
    // Sanity unavailable
  }

  if (!gallery) notFound()

  const images = (gallery.images ?? []).filter(hasImageAsset)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link
        href="/media"
        className="inline-flex items-center gap-1 text-sm text-eaa-blue hover:underline mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Media
      </Link>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-eaa-blue mb-2">{gallery.title}</h1>
      {gallery.publishedAt && (
        <p className="text-sm text-gray-500 mb-6">{formatDate(gallery.publishedAt)}</p>
      )}

      {/* Plain text description (shown if no rich description) */}
      {gallery.description && !gallery.richDescription?.length && (
        <p className="text-gray-700 mb-8 leading-relaxed">{gallery.description}</p>
      )}

      {/* Rich description (WYSIWYG) */}
      {gallery.richDescription && gallery.richDescription.length > 0 && (
        <div className="prose prose-lg max-w-none mb-8">
          <PortableText
            value={gallery.richDescription as any[]}
            components={richDescriptionComponents}
          />
        </div>
      )}

      {/* ── Gallery display ─────────────────────────────────────────── */}

      {gallery.displayType === 'slideshow' && (
        <>
          {images.length > 0 ? (
            <MediaSlideshowCarousel images={images} />
          ) : (
            <p className="text-gray-500 italic">No images have been added to this gallery yet.</p>
          )}
        </>
      )}

      {gallery.displayType === 'imageGrid' && (
        <>
          {images.length > 0 ? (
            <MediaImageGrid images={images} />
          ) : (
            <p className="text-gray-500 italic">No images have been added to this gallery yet.</p>
          )}
        </>
      )}

      {gallery.displayType === 'videoEmbed' && (
        <>
          {gallery.videoUrl ? (
            <MediaVideoEmbed
              videoUrl={gallery.videoUrl}
              videoTitle={gallery.videoTitle}
              videoSubtitle={gallery.videoSubtitle}
            />
          ) : (
            <p className="text-gray-500 italic">No video URL has been set for this gallery.</p>
          )}
        </>
      )}
    </div>
  )
}
