import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PortableText } from '@portabletext/react'
import { getNewsArticleBySlug, getNewsArticleSlugs, urlFor } from '@/lib/sanity'
import { safePortableTextLinkHref } from '@/lib/search-safety'
import SharedElement from '@/components/SharedElement'

/** No ISR cache: editors expect Sanity edits to show without waiting (see /news/page.tsx). */
export const revalidate = 0

export async function generateStaticParams() {
  try {
    const rows = await getNewsArticleSlugs()
    return (rows ?? [])
      .filter((r: { slug?: string }) => Boolean(r.slug))
      .map((r: { slug: string }) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

const portableTextComponents = {
  types: {
    image: ({ value }: { value: { caption?: string } }) => {
      const src = urlFor(value).width(900).fit('max').url()
      const caption =
        typeof value.caption === 'string' && value.caption.trim() ? value.caption.trim() : ''
      return (
        <figure className="my-6">
          <Image
            src={src}
            alt={caption || 'Illustration in article body'}
            width={900}
            height={600}
            className="rounded-lg w-full object-cover"
          />
          {caption ? (
            <figcaption className="mt-2 text-center text-sm text-gray-500 italic">{caption}</figcaption>
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
      <blockquote className="border-l-4 border-eaa-yellow pl-4 italic text-gray-600 my-4">{children}</blockquote>
    ),
  },
  marks: {
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

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  let article: { title?: string; excerpt?: string } | null = null
  try {
    article = await getNewsArticleBySlug(slug)
  } catch {
    article = null
  }
  if (!article?.title) {
    return { title: 'News' }
  }
  return {
    title: `${article.title} | EAA 690`,
    description: article.excerpt || 'EAA Chapter 690 news.',
  }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let article: Awaited<ReturnType<typeof getNewsArticleBySlug>> = null
  try {
    article = await getNewsArticleBySlug(slug)
  } catch {
    notFound()
  }
  if (!article) notFound()

  const featuredUrl = article.image ? urlFor(article.image).width(960).height(520).fit('crop').url() : null
  const hasBody = Array.isArray(article.content) && article.content.length > 0

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-eaa-light-blue hover:text-eaa-blue font-semibold mb-8 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded"
        aria-label="Back to news listing"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        News
      </Link>

      <article aria-labelledby="article-heading">
        <header className="mb-8">
          <p className="text-sm text-gray-500 mb-2">
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            {article.author ? ` · By ${article.author}` : null}
          </p>
          <SharedElement name={`news-title-${slug}`}>
            <h1 id="article-heading" className="text-3xl sm:text-4xl font-bold text-eaa-blue mb-4">
              {article.title}
            </h1>
          </SharedElement>
          {article.excerpt ? (
            <p className="text-lg text-gray-700 border-l-4 border-eaa-yellow pl-4 py-1">{article.excerpt}</p>
          ) : null}
        </header>

        {featuredUrl ? (
          <div className="mb-10 rounded-xl overflow-hidden shadow-md">
            <Image
              src={featuredUrl}
              alt={article.title ? `Featured image for ${article.title}` : 'Article featured image'}
              width={960}
              height={520}
              className="w-full object-cover"
              priority
            />
          </div>
        ) : null}

        {hasBody ? (
          <section className="prose max-w-none" aria-label="Article body">
            <PortableText value={article.content} components={portableTextComponents} />
          </section>
        ) : (
          <p className="text-gray-600">No article body has been added yet.</p>
        )}
      </article>
    </div>
  )
}
