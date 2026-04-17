import Link from 'next/link'
import type { ReactNode } from 'react'
import type { PortableTextBlock } from '@portabletext/types'
import { isSafeSiteHref } from '@/lib/search-safety'
import { getProgramFormsSettings } from '@/lib/program-forms-sanity'
import type { ProgramFormSlotKey } from '@/lib/program-availability'
import ProgramPortableText from '@/components/programs/ProgramPortableText'
import ProgramFormBlock from '@/components/programs/ProgramFormBlock'
import MediaVideoEmbed from '@/components/MediaVideoEmbed'
import { urlFor } from '@/lib/sanity'

export type ProgramSectionUnknown = {
  _type?: string
  _key?: string
  [key: string]: unknown
}

/**
 * Sanity asset refs encode source dimensions as `image-{id}-{W}x{H}-{ext}`.
 * Passing intrinsic width/height to <img> reserves layout space and avoids
 * cumulative layout shift (supports WCAG 2.4.4 Reflow).
 */
function parseAssetRefDimensions(
  ref: string | undefined
): { width: number; height: number } | null {
  if (!ref) return null
  const m = /^image-[a-zA-Z0-9]+-(\d+)x(\d+)-[a-zA-Z0-9]+$/.exec(ref)
  if (!m) return null
  const w = Number.parseInt(m[1], 10)
  const h = Number.parseInt(m[2], 10)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
  return { width: w, height: h }
}

/** Yellow banner: blue filled buttons (white text). Blue banner: yellow filled buttons for contrast. */
function CtaBannerButton({
  label,
  href,
  tone,
}: {
  label: string
  href: string
  tone: 'onYellow' | 'onBlue'
}) {
  const t = href.trim()
  const l = label.trim()
  if (!l || !t) return null

  const className =
    tone === 'onYellow'
      ? 'inline-flex justify-center items-center min-h-[44px] px-6 py-3 rounded-md font-semibold text-center bg-eaa-blue text-white hover:bg-eaa-light-blue transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-yellow'
      : 'inline-flex justify-center items-center min-h-[44px] px-6 py-3 rounded-md font-semibold text-center bg-eaa-yellow text-eaa-blue hover:bg-yellow-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue'

  if (t.startsWith('http://') || t.startsWith('https://')) {
    return (
      <a href={t} target="_blank" rel="noopener noreferrer" className={className}>
        {l}
      </a>
    )
  }
  if (isSafeSiteHref(t)) {
    return (
      <Link href={t} className={className}>
        {l}
      </Link>
    )
  }
  return null
}

function parseCtaButtons(section: Record<string, unknown>): { label: string; href: string }[] {
  const raw = section.buttons
  if (Array.isArray(raw) && raw.length > 0) {
    const out: { label: string; href: string }[] = []
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue
      const o = row as { label?: string; href?: string }
      const label = typeof o.label === 'string' ? o.label.trim() : ''
      const href = typeof o.href === 'string' ? o.href.trim() : ''
      if (label && href) out.push({ label, href })
    }
    if (out.length > 0) return out
  }
  const buttonLabel = typeof section.buttonLabel === 'string' ? section.buttonLabel.trim() : ''
  const buttonHref = typeof section.buttonHref === 'string' ? section.buttonHref.trim() : ''
  if (buttonLabel && buttonHref) return [{ label: buttonLabel, href: buttonHref }]
  return []
}

export default async function ProgramPageSections({ sections }: { sections: unknown[] | null | undefined }) {
  if (!sections || !Array.isArray(sections)) return null

  const slots = await getProgramFormsSettings()

  const nodes: ReactNode[] = []

  for (const raw of sections) {
    const s = raw as ProgramSectionUnknown
    const k = s._key ?? s._type ?? 'k'
    switch (s._type) {
      case 'programSectionAlert': {
        const title = typeof s.title === 'string' ? s.title : ''
        const body = s.body as PortableTextBlock[] | undefined
        nodes.push(
          <div key={k} className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg mb-8">
            {title ? <h2 className="text-xl font-bold mb-2">{title}</h2> : null}
            <div className="prose prose-sm max-w-none">
              <ProgramPortableText value={body} />
            </div>
          </div>
        )
        break
      }
      case 'programSectionRich': {
        const heading = typeof s.heading === 'string' ? s.heading.trim() : ''
        const body = s.body as PortableTextBlock[] | undefined
        nodes.push(
          <div key={k} className="bg-white rounded-lg shadow-md p-6 mb-8">
            {heading ? <h2 className="text-2xl font-bold text-eaa-blue mb-4">{heading}</h2> : null}
            {/* flow-root contains floats from inline images so they don't bleed past the card */}
            <div className="prose max-w-none [display:flow-root]">
              <ProgramPortableText value={body} />
            </div>
          </div>
        )
        break
      }
      case 'programSectionImageText': {
        const heading = typeof s.heading === 'string' ? s.heading.trim() : ''
        const body = s.body as PortableTextBlock[] | undefined
        const img = s.image as
          | { asset?: { _ref?: string }; alt?: string; caption?: string }
          | undefined
        if (!img?.asset?._ref) break
        const position: 'left' | 'right' = s.imagePosition === 'left' ? 'left' : 'right'
        const width: 'third' | 'half' = s.imageWidth === 'half' ? 'half' : 'third'
        let src: string
        try {
          src = urlFor(img).width(1400).fit('max').auto('format').url()
        } catch {
          break
        }
        const imgCol = width === 'half' ? 'md:col-span-6' : 'md:col-span-4'
        const txtCol = width === 'half' ? 'md:col-span-6' : 'md:col-span-8'
        const caption = typeof img.caption === 'string' ? img.caption.trim() : ''
        const dims = parseAssetRefDimensions(img.asset?._ref)
        const figureEl = (
          <figure className={imgCol}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={typeof img.alt === 'string' ? img.alt : ''}
              className="rounded-md w-full h-auto"
              loading="lazy"
              decoding="async"
              {...(dims ? { width: dims.width, height: dims.height } : {})}
            />
            {caption ? (
              <figcaption className="text-sm text-gray-500 mt-2">{caption}</figcaption>
            ) : null}
          </figure>
        )
        const textEl = (
          <div className={`${txtCol} prose max-w-none`}>
            <ProgramPortableText value={body} />
          </div>
        )
        // WCAG 1.3.2 Meaningful Sequence: DOM order matches desktop visual order
        // (and mobile stack order). When the editor puts the image on the right,
        // text reads/stacks first; image-left means image is the lead.
        nodes.push(
          <div key={k} className="bg-white rounded-lg shadow-md p-6 mb-8">
            {heading ? (
              <h2 className="text-2xl font-bold text-eaa-blue mb-4">{heading}</h2>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {position === 'left' ? (
                <>
                  {figureEl}
                  {textEl}
                </>
              ) : (
                <>
                  {textEl}
                  {figureEl}
                </>
              )}
            </div>
          </div>
        )
        break
      }
      case 'programSectionFeatureColumns': {
        const cols = Array.isArray(s.columns) ? s.columns : []
        nodes.push(
          <div key={k} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cols.map((col: unknown, i: number) => {
              const c = col as { title?: string; body?: string }
              const title = typeof c.title === 'string' ? c.title : ''
              const body = typeof c.body === 'string' ? c.body : ''
              return (
                <div key={`${k}-c${i}`} className="bg-eaa-blue text-white p-6 rounded-lg">
                  {title ? <h2 className="text-xl font-bold mb-3">{title}</h2> : null}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
                </div>
              )
            })}
          </div>
        )
        break
      }
      case 'programSectionPdfLinks': {
        const gate = typeof s.documentsGate === 'string' ? s.documentsGate : 'none'
        let gateKey: ProgramFormSlotKey | null = null
        if (gate === 'youthAviation') gateKey = 'youthAviation'
        if (gate === 'scholarship') gateKey = 'scholarship'
        const docsVisible = gateKey ? slots[gateKey].documentsVisible : true

        const sectionHeading =
          typeof s.sectionHeading === 'string' && s.sectionHeading.trim()
            ? s.sectionHeading.trim()
            : 'Program documents'
        const intro = s.intro as PortableTextBlock[] | undefined
        const links = Array.isArray(s.links) ? s.links : []

        if (!docsVisible) {
          nodes.push(
            <div key={k} className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-bold text-eaa-blue mb-2">{sectionHeading}</h2>
              <p className="text-gray-700 text-sm">
                Chapter program PDFs are not available for download here right now. If you need paperwork, please{' '}
                <Link href="/contact" className="text-eaa-light-blue font-semibold hover:underline">
                  contact the chapter
                </Link>
                .
              </p>
            </div>
          )
          break
        }

        nodes.push(
          <div key={k} className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-eaa-blue mb-4">{sectionHeading}</h2>
            {intro && intro.length > 0 ? (
              <div className="prose prose-sm max-w-none mb-4">
                <ProgramPortableText value={intro} />
              </div>
            ) : null}
            <ul className="space-y-3">
              {links.map((row: unknown, i: number) => {
                const L = row as { label?: string; url?: string }
                const label = typeof L.label === 'string' ? L.label : ''
                const url = typeof L.url === 'string' ? L.url : ''
                if (!label || !url.startsWith('http')) return null
                return (
                  <li key={`${k}-l${i}`}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-eaa-light-blue hover:underline flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )
        break
      }
      case 'programSectionPricing': {
        const sectionHeading = typeof s.sectionHeading === 'string' ? s.sectionHeading : ''
        const intro = s.intro as PortableTextBlock[] | undefined
        const tiers = Array.isArray(s.tiers) ? s.tiers : []
        nodes.push(
          <div key={k} className="bg-white rounded-lg shadow-md p-6 mb-8">
            {sectionHeading ? <h2 className="text-2xl font-bold text-eaa-blue mb-4">{sectionHeading}</h2> : null}
            {intro && intro.length > 0 ? (
              <div className="prose prose-sm max-w-none mb-4">
                <ProgramPortableText value={intro} />
              </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {tiers.map((tier: unknown, i: number) => {
                const t = tier as { name?: string; subtitle?: string; price?: string; note?: string }
                return (
                  <div key={`${k}-t${i}`} className="bg-gray-50 rounded-lg p-4 text-center">
                    {t.name ? <h3 className="font-bold text-eaa-blue text-lg mb-1">{t.name}</h3> : null}
                    {t.subtitle ? <p className="text-gray-600 text-sm mb-1">{t.subtitle}</p> : null}
                    {t.price ? <p className="font-semibold text-eaa-blue text-xl mb-2">{t.price}</p> : null}
                    {t.note ? <p className="text-sm text-gray-500">{t.note}</p> : null}
                  </div>
                )
              })}
            </div>
          </div>
        )
        break
      }
      case 'programSectionForm': {
        nodes.push(
          <ProgramFormBlock
            key={k}
            sectionHeading={typeof s.sectionHeading === 'string' ? s.sectionHeading : undefined}
            intro={s.intro as PortableTextBlock[] | undefined}
            formKey={typeof s.formKey === 'string' ? s.formKey : undefined}
          />
        )
        break
      }
      case 'programSectionVideoEmbed': {
        const videoUrl = typeof s.videoUrl === 'string' ? s.videoUrl.trim() : ''
        if (!videoUrl) break
        const heading = typeof s.heading === 'string' ? s.heading.trim() : ''
        const caption = typeof s.caption === 'string' ? s.caption.trim() : ''
        nodes.push(
          <div key={k} className="bg-white rounded-lg shadow-md p-6 mb-8">
            <MediaVideoEmbed
              videoUrl={videoUrl}
              videoTitle={heading || undefined}
              videoSubtitle={caption || undefined}
            />
          </div>
        )
        break
      }
      case 'programSectionCta': {
        const title = typeof s.title === 'string' ? s.title : ''
        const body = s.body as PortableTextBlock[] | undefined
        const style = s.style === 'yellow' ? 'yellow' : 'blue'
        const wrap =
          style === 'yellow'
            ? 'bg-eaa-yellow text-eaa-blue p-6 rounded-lg mb-8'
            : 'bg-eaa-blue text-white p-6 rounded-lg mb-8'
        const ctaButtons = parseCtaButtons(s as Record<string, unknown>)
        const btnTone = style === 'yellow' ? 'onYellow' : 'onBlue'
        nodes.push(
          <div key={k} className={wrap}>
            {title ? <h2 className="text-xl font-bold mb-3">{title}</h2> : null}
            {body && body.length > 0 ? (
              <div className="max-w-none mb-4">
                <ProgramPortableText value={body} variant={style === 'blue' ? 'onDark' : 'default'} />
              </div>
            ) : null}
            {ctaButtons.length > 0 ? (
              <div className="mt-2 flex flex-col sm:flex-row flex-wrap gap-3">
                {ctaButtons.map((btn, i) => (
                  <CtaBannerButton key={`${k}-btn-${i}`} label={btn.label} href={btn.href} tone={btnTone} />
                ))}
              </div>
            ) : null}
          </div>
        )
        break
      }
      default:
        break
    }
  }

  return <>{nodes}</>
}
