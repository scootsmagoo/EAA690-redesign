'use client'

import type { PortableTextBlock } from '@portabletext/types'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { safePortableTextLinkHref } from '@/lib/search-safety'

export type ProgramPortableTextVariant = 'default' | 'onDark'

function buildComponents(variant: ProgramPortableTextVariant): PortableTextComponents {
  const isDark = variant === 'onDark'

  const body = isDark ? 'text-white/95' : 'text-gray-700'
  const heading = isDark ? 'text-white' : 'text-eaa-blue'
  const listText = isDark ? 'text-white/95' : 'text-gray-700'
  const mutedSpan = isDark ? 'text-white/80' : 'decoration-gray-400'
  const linkExternal = isDark
    ? 'text-eaa-yellow underline decoration-eaa-yellow/80 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue'
    : 'text-eaa-light-blue underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2'
  const linkInternal = isDark
    ? 'text-eaa-yellow underline decoration-eaa-yellow/80 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue'
    : 'text-eaa-light-blue underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2'

  return {
    block: {
      normal: ({ children }: { children?: ReactNode }) => (
        <p className={`mb-4 leading-relaxed ${body}`}>{children}</p>
      ),
      h3: ({ children }: { children?: ReactNode }) => (
        <h3 className={`text-xl font-bold ${heading} mt-6 mb-2`}>{children}</h3>
      ),
      h4: ({ children }: { children?: ReactNode }) => (
        <h4 className={`text-lg font-bold ${heading} mt-4 mb-2`}>{children}</h4>
      ),
    },
    list: {
      bullet: ({ children }: { children?: ReactNode }) => (
        <ul className={`list-disc list-inside space-y-2 ${listText} mb-4`}>{children}</ul>
      ),
      number: ({ children }: { children?: ReactNode }) => (
        <ol className={`list-decimal list-inside space-y-2 ${listText} mb-4`}>{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }: { children?: ReactNode }) => <li className="ml-1">{children}</li>,
      number: ({ children }: { children?: ReactNode }) => <li className="ml-1">{children}</li>,
    },
    marks: {
      link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => {
        const safe = safePortableTextLinkHref(value?.href)
        if (!safe) {
          return <span className={`underline ${mutedSpan}`}>{children}</span>
        }
        if (safe.startsWith('http://') || safe.startsWith('https://')) {
          return (
            <a href={safe} className={linkExternal} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          )
        }
        return <Link href={safe} className={linkInternal}>{children}</Link>
      },
    },
  }
}

type Props = {
  value: PortableTextBlock[] | null | undefined
  /** Use on navy/dark chapter panels (e.g. CTA banner) so body copy is not gray-on-blue. */
  variant?: ProgramPortableTextVariant
}

export default function ProgramPortableText({ value, variant = 'default' }: Props) {
  if (!value || !Array.isArray(value) || value.length === 0) return null
  return <PortableText value={value} components={buildComponents(variant)} />
}
