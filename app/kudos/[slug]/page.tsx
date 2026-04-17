import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PortableText } from '@portabletext/react'
import { getKudosBySlug, getKudosSlugs, urlFor } from '@/lib/sanity'
import { safePortableTextLinkHref } from '@/lib/search-safety'
import MediaImageGrid from '@/components/MediaImageGrid'
import type { MediaGalleryImage } from '@/lib/sanity-types'

/** No ISR cache so editor publishes show without waiting (matches sibling pages). */
export const revalidate = 0

export async function generateStaticParams() {
  try {
    const rows = await getKudosSlugs()
    return (rows ?? [])
      .filter((r: { slug?: string }) => Boolean(r.slug))
      .map((r: { slug: string }) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const portableTextComponents = {
  types: {
    image: ({ value }: { value: { caption?: string } & Parameters<typeof urlFor>[0] }) => {
      const src = urlFor(value).width(900).fit('max').url()
      const caption =
        typeof value.caption === 'string' && value.caption.trim() ? value.caption.trim() : ''
      return (
        <figure className="my-6">
          <Image
            src={src}
            alt={caption || 'Photo from kudos story'}
            width={900}
            height={600}
            className="rounded-lg w-full object-cover"
          />
          {caption ? (
            <figcaption className="mt-2 text-center text-sm text-gray-600 italic">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      )
    },
  },
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl font-bold text-eaa-blue mt-8 mb-3">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl font-bold text-eaa-blue mt-6 mb-2">{children}</h3>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-4 border-eaa-yellow pl-4 italic text-gray-600 my-4">
        {children}
      </blockquote>
    ),
  },
  marks: {
    // Same OWASP-hardened link handling used by /news/[slug] — blocks
    // javascript:, data:, vbscript:, and unsafe relative paths from CMS Portable Text.
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let kudo: { name?: string; achievement?: string; excerpt?: string } | null = null
  try {
    kudo = await getKudosBySlug(slug)
  } catch {
    kudo = null
  }
  if (!kudo?.name) {
    return { title: 'Kudos | EAA 690' }
  }
  const title = `${kudo.name}${kudo.achievement ? ` — ${kudo.achievement}` : ''} | EAA 690 Kudos`
  const description =
    (kudo.excerpt && kudo.excerpt.trim()) ||
    `Kudos to ${kudo.name} from EAA Chapter 690.`
  return {
    title,
    description,
    alternates: { canonical: `/kudos/${slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/kudos/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function KudosDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let kudo: Awaited<ReturnType<typeof getKudosBySlug>> = null
  try {
    kudo = await getKudosBySlug(slug)
  } catch {
    notFound()
  }
  if (!kudo) notFound()

  const featuredUrl = kudo.featuredImage
    ? urlFor(kudo.featuredImage).width(960).height(560).fit('crop').url()
    : null

  const gallery: MediaGalleryImage[] = Array.isArray(kudo.gallery) ? kudo.gallery : []
  const hasBody = Array.isArray(kudo.content) && kudo.content.length > 0
  const formattedDate = formatDate(kudo.date)

  // Reuse MediaImageGrid (already a fully-accessible lightbox: focus trap,
  // ESC/arrow keys, ARIA dialog, polite live region).
  const buildGalleryUrl = (img: MediaGalleryImage, width: number) =>
    urlFor(img).width(width).fit('max').url()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-gray-700">
          <li>
            <Link
              href="/"
              className="hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-400">
            /
          </li>
          <li>
            <Link
              href="/kudos"
              className="hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
            >
              Kudos
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-400">
            /
          </li>
          <li aria-current="page" className="text-gray-900 font-medium truncate max-w-[16rem]">
            {kudo.name}
          </li>
        </ol>
      </nav>

      <Link
        href="/kudos"
        aria-label="Back to all kudos"
        className="inline-flex items-center gap-1 text-sm text-eaa-light-blue hover:text-eaa-blue font-semibold mb-8 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
      >
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Kudos
      </Link>

      <article aria-labelledby="kudo-heading">
        <header className="mb-8">
          <h1
            id="kudo-heading"
            className="text-3xl sm:text-4xl font-bold text-eaa-blue mb-1"
          >
            {kudo.name}
          </h1>
          {kudo.achievement ? (
            <p className="text-eaa-light-blue font-semibold text-lg mb-1">{kudo.achievement}</p>
          ) : null}
          {formattedDate && kudo.date ? (
            <p className="text-sm text-gray-600">
              <time dateTime={kudo.date}>{formattedDate}</time>
            </p>
          ) : null}
        </header>

        {featuredUrl ? (
          <div className="mb-8 rounded-xl overflow-hidden shadow-md">
            <Image
              src={featuredUrl}
              alt={`${kudo.name}${kudo.achievement ? ` — ${kudo.achievement}` : ''}`}
              width={960}
              height={560}
              className="w-full object-cover"
              priority
            />
          </div>
        ) : null}

        {kudo.excerpt ? (
          <div className="mb-8 border-l-4 border-eaa-yellow bg-yellow-50 px-5 py-4 rounded-r-lg">
            <p className="text-gray-800 font-medium leading-relaxed">{kudo.excerpt}</p>
          </div>
        ) : null}

        {hasBody ? (
          <section className="prose max-w-none mb-12" aria-label="Full story">
            <PortableText value={kudo.content} components={portableTextComponents} />
          </section>
        ) : null}

        {gallery.length > 0 ? (
          <section id="gallery" className="scroll-mt-24" aria-labelledby="gallery-heading">
            <h2
              id="gallery-heading"
              className="text-2xl font-bold text-eaa-blue mb-6 flex items-center gap-2"
            >
              <svg
                className="w-6 h-6 text-eaa-yellow"
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
              Photo Gallery
            </h2>
            <MediaImageGrid images={gallery} getImageUrl={buildGalleryUrl} />
          </section>
        ) : null}
      </article>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          href="/kudos"
          aria-label="Back to all kudos"
          className="inline-flex items-center gap-1 text-sm text-eaa-light-blue hover:text-eaa-blue font-semibold transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to All Kudos
        </Link>
      </div>
    </div>
  )
}
