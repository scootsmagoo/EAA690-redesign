'use client'

import type { PortableTextBlock } from '@portabletext/types'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { safePortableTextLinkHref } from '@/lib/search-safety'
import { urlFor } from '@/lib/sanity'

type InlineImageValue = {
  asset?: { _ref?: string }
  alt?: string
  caption?: string
  align?: 'left' | 'right' | 'center' | 'full'
  size?: 'sm' | 'md' | 'lg'
  isDecorative?: boolean
}

/**
 * Sanity asset refs follow `image-{id}-{W}x{H}-{ext}`. Parsing the dimensions
 * lets us pass intrinsic width/height to <img> so the browser reserves space
 * (avoids cumulative layout shift; supports WCAG 2.4.4 reflow).
 */
function parseAssetDimensions(ref: string | undefined): { width: number; height: number } | null {
  if (!ref) return null
  const m = /^image-[a-zA-Z0-9]+-(\d+)x(\d+)-[a-zA-Z0-9]+$/.exec(ref)
  if (!m) return null
  const w = Number.parseInt(m[1], 10)
  const h = Number.parseInt(m[2], 10)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
  return { width: w, height: h }
}

function inlineImageClasses(
  align: InlineImageValue['align'],
  size: InlineImageValue['size']
): string {
  const a = align ?? 'right'
  const s = size ?? 'md'

  if (a === 'full') {
    return 'block w-full my-6 clear-both'
  }
  if (a === 'center') {
    const w = s === 'lg' ? 'md:max-w-3xl' : s === 'sm' ? 'md:max-w-sm' : 'md:max-w-xl'
    return `block mx-auto my-6 clear-both ${w}`
  }
  const wFloat = s === 'lg' ? 'md:w-1/2' : s === 'sm' ? 'md:w-1/4' : 'md:w-1/3'
  if (a === 'left') {
    return `block w-full md:w-auto md:float-left md:mr-6 md:mb-3 my-4 ${wFloat}`
  }
  return `block w-full md:w-auto md:float-right md:ml-6 md:mb-3 my-4 ${wFloat}`
}

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
    types: {
      image: ({ value }: { value?: InlineImageValue }) => {
        if (!value?.asset?._ref) return null
        let src: string
        try {
          src = urlFor(value).width(1200).fit('max').auto('format').url()
        } catch {
          return null
        }
        const decorative = value.isDecorative === true
        // WCAG 1.1.1: decorative images carry no information — empty alt + hidden from AT.
        const alt = decorative ? '' : (value.alt ?? '').trim()
        const caption = decorative ? '' : (value.caption ?? '').trim()
        const figureClass = inlineImageClasses(value.align, value.size)
        // text-white/90 on dark surfaces clears WCAG AA at 14px; /80 was borderline.
        const captionClass = isDark ? 'text-white/90' : 'text-gray-500'
        const dims = parseAssetDimensions(value.asset?._ref)
        return (
          <figure
            className={figureClass}
            {...(decorative ? { 'aria-hidden': 'true', role: 'presentation' as const } : {})}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="rounded-md w-full h-auto"
              loading="lazy"
              decoding="async"
              {...(dims ? { width: dims.width, height: dims.height } : {})}
            />
            {caption ? (
              <figcaption className={`text-sm mt-1 ${captionClass}`}>{caption}</figcaption>
            ) : null}
          </figure>
        )
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
