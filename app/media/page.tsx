import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getMediaPage, getMediaGalleries, urlFor } from '@/lib/sanity'
import SharedElement from '@/components/SharedElement'
import type { MediaGalleryCard, MediaPageContent } from '@/lib/sanity-types'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Media | EAA 690',
  description: 'Photos and videos from EAA 690 events, fly-outs, and activities.',
}

const displayTypeLabel: Record<string, string> = {
  slideshow: 'Slideshow',
  imageGrid: 'Photos',
  videoEmbed: 'Video',
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function MediaPage() {
  let pageData: MediaPageContent | null = null
  let galleries: MediaGalleryCard[] = []

  try {
    pageData = await getMediaPage()
  } catch {
    // Sanity not configured — use defaults
  }

  try {
    const data = await getMediaGalleries()
    if (data?.length) galleries = data
  } catch {
    // Sanity not configured — show empty state
  }

  const pageTitle = pageData?.pageTitle?.trim() || 'Media'
  const pageDescription =
    pageData?.pageDescription?.trim() ||
    'Browse photos and videos from EAA 690 events, fly-outs, and activities.'

  return (
    <div>
      {/* Hero image */}
      {pageData?.heroImage && (
        <div className="w-full">
          <Image
            src={urlFor(pageData.heroImage).width(2000).fit('max').url()}
            alt={pageData.heroImageAlt?.trim() || 'EAA 690 Media'}
            width={2000}
            height={600}
            className="w-full h-auto block"
            priority
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-eaa-blue mb-4">{pageTitle}</h1>
        <p className="text-lg text-gray-700 mb-10">{pageDescription}</p>

        {galleries.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-xl">No galleries yet.</p>
            <p className="mt-2 text-sm">
              Add galleries in the{' '}
              <Link href="/studio" className="underline text-eaa-blue">
                Studio
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => {
              const slug = gallery.slug?.current
              if (!slug) return null
              const label = displayTypeLabel[gallery.displayType] ?? gallery.displayType
              const coverSrc = gallery.coverImage
                ? urlFor(gallery.coverImage).width(600).height(400).fit('crop').url()
                : null

              return (
                <Link
                  key={gallery._id}
                  href={`/media/${slug}`}
                  className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow"
                >
                  {/* Thumbnail */}
                  <div className="relative h-52 bg-gray-200 overflow-hidden">
                    {coverSrc ? (
                      <Image
                        src={coverSrc}
                        alt={gallery.coverImageAlt?.trim() || gallery.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No cover image
                      </div>
                    )}
                    {/* Display type badge */}
                    <span className="absolute top-2 left-2 bg-eaa-blue text-white text-xs font-medium px-2 py-0.5 rounded">
                      {label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <SharedElement name={`media-title-${slug}`}>
                      <h2 className="font-semibold text-eaa-blue text-lg leading-snug group-hover:underline">
                        {gallery.title}
                      </h2>
                    </SharedElement>
                    {gallery.publishedAt && (
                      <p className="text-xs text-gray-500 mt-1">{formatDate(gallery.publishedAt)}</p>
                    )}
                    {gallery.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                        {gallery.description}
                      </p>
                    )}
                    {typeof gallery.imageCount === 'number' && gallery.imageCount > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {gallery.imageCount} photo{gallery.imageCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


