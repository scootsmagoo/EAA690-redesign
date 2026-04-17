import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProgramPageBySlug, getProgramPageSlugs } from '@/lib/sanity'
import ProgramPageSections from '@/components/programs/ProgramPageSections'

/** Always render from Sanity on the server — avoids stale SSG HTML missing newly published fields (e.g. CTA buttons). */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateStaticParams() {
  try {
    const rows = await getProgramPageSlugs()
    return (rows ?? []).filter((r) => r.slug).map((r) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug: raw } = await params
  const slug = typeof raw === 'string' ? raw.trim() : ''
  if (!slug) return { title: 'Program' }
  const page = await getProgramPageBySlug(slug)
  if (!page) return { title: 'Program' }
  const seo = page.seo as { metaTitle?: string; metaDescription?: string } | undefined
  const titleBase = typeof page.title === 'string' ? page.title : 'Program'
  return {
    title: seo?.metaTitle?.trim() || `${titleBase} | EAA 690`,
    description: seo?.metaDescription?.trim() || undefined,
  }
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params
  const slug = typeof raw === 'string' ? raw.trim() : ''
  if (!slug) notFound()

  const page = await getProgramPageBySlug(slug)
  if (!page || !page.title) notFound()

  const subtitle = typeof page.subtitle === 'string' && page.subtitle.trim() ? page.subtitle.trim() : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-4">{page.title}</h1>
      {subtitle ? <p className="text-lg text-gray-600 mb-8">{subtitle}</p> : null}

      <ProgramPageSections sections={page.sections} />

      <p className="text-sm text-gray-500 mt-10">
        <Link href="/programs" className="text-eaa-light-blue font-semibold hover:underline">
          ← Back to Programs
        </Link>
      </p>
    </div>
  )
}
