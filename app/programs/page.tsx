import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import type { ReactNode } from 'react'
import { getProgramsPageSettings, getProgramsIndexList } from '@/lib/sanity'
import { PROGRAM_INDEX_FALLBACK } from '@/lib/program-nav-fallback'
import { safePortableTextLinkHref } from '@/lib/search-safety'

export const revalidate = 0

const introComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="text-lg text-gray-700 mb-4">{children}</p>
    ),
  },
  marks: {
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => {
      const safe = safePortableTextLinkHref(value?.href)
      if (!safe) return <span className="underline decoration-gray-400">{children}</span>
      if (safe.startsWith('http://') || safe.startsWith('https://')) {
        return (
          <a href={safe} className="text-eaa-light-blue underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        )
      }
      return (
        <Link href={safe} className="text-eaa-light-blue underline">
          {children}
        </Link>
      )
    },
  },
}

export default async function ProgramsPage() {
  const settings = await getProgramsPageSettings()
  const list = await getProgramsIndexList()
  const programs = list.length > 0 ? list : PROGRAM_INDEX_FALLBACK

  const pageTitle =
    settings && typeof settings.pageTitle === 'string' && settings.pageTitle.trim()
      ? settings.pageTitle.trim()
      : 'Programs'

  const intro = settings?.intro

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">{pageTitle}</h1>

      {intro && Array.isArray(intro) && intro.length > 0 ? (
        <div className="prose max-w-none mb-8">
          <PortableText value={intro} components={introComponents} />
        </div>
      ) : (
        <div className="prose max-w-none mb-8">
          <p className="text-lg text-gray-700">
            EAA 690 offers a wide range of programs designed to promote aviation, support youth education, and engage
            our community. From flight experiences to educational opportunities, we have something for everyone
            interested in aviation.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Link
            key={program.href}
            href={program.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-eaa-yellow"
          >
            <h2 className="text-xl font-bold text-eaa-blue mb-2">{program.name}</h2>
            <p className="text-gray-600">{program.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
