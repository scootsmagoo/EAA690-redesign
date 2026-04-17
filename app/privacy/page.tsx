import type { Metadata } from 'next'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import type { ReactNode } from 'react'
import { getPrivacyPage } from '@/lib/sanity'
import { safePortableTextLinkHref } from '@/lib/search-safety'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Privacy & data use | EAA 690',
  description: 'How EAA Chapter 690 handles information collected through our website and forms.',
}

const components = {
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
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">{children}</ul>
    ),
    number: ({ children }: { children?: ReactNode }) => (
      <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">{children}</ol>
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

export default async function PrivacyPage() {
  const doc = await getPrivacyPage()
  const title =
    doc && typeof doc.title === 'string' && doc.title.trim() ? doc.title.trim() : 'Privacy & data use'
  const body = doc?.body

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">{title}</h1>

      {body && Array.isArray(body) && body.length > 0 ? (
        <div className="prose max-w-none">
          <PortableText value={body} components={components} />
        </div>
      ) : (
        <div className="prose text-gray-700 space-y-4">
          <p>
            Chapter volunteers are preparing a short privacy summary for this page. In the meantime, if you have
            questions about information submitted through our website or program forms, please{' '}
            <Link href="/contact" className="text-eaa-light-blue font-semibold hover:underline">
              contact the chapter
            </Link>
            .
          </p>
        </div>
      )}

      <p className="mt-10 text-sm text-gray-500">
        <Link href="/programs" className="text-eaa-light-blue font-semibold hover:underline">
          ← Programs
        </Link>
      </p>
    </div>
  )
}
