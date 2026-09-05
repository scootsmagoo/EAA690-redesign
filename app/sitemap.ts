import type { MetadataRoute } from 'next'
import { getSiteBaseURL } from '@/lib/site-url'
import {
  getKudosSlugs,
  getMediaGallerySlugs,
  getNewsArticleSlugs,
  getNewsletterIssueSlugs,
  getNewsletterSectionSlugs,
  getProgramPageSlugs,
} from '@/lib/sanity'

export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

/** Public, indexable routes that are not driven by CMS slugs. */
const STATIC_ROUTES: Array<[path: string, priority: number, changeFrequency: Entry['changeFrequency']]> = [
  ['/', 1.0, 'weekly'],
  ['/calendar', 0.9, 'weekly'],
  ['/programs', 0.9, 'monthly'],
  ['/join', 0.9, 'monthly'],
  ['/donate', 0.8, 'monthly'],
  ['/store', 0.7, 'weekly'],
  ['/news', 0.8, 'weekly'],
  ['/newsletter', 0.8, 'monthly'],
  ['/kudos', 0.6, 'monthly'],
  ['/media', 0.6, 'monthly'],
  ['/contact', 0.7, 'yearly'],
  ['/chapter', 0.7, 'monthly'],
  ['/chapter/board', 0.6, 'monthly'],
  ['/chapter/general-info', 0.6, 'yearly'],
  ['/chapter/visit-us', 0.6, 'yearly'],
  ['/privacy', 0.2, 'yearly'],
]

async function slugs(fetcher: () => Promise<Array<{ slug: string }>>): Promise<string[]> {
  try {
    const rows = await fetcher()
    return rows.map((r) => r.slug).filter((s): s is string => typeof s === 'string' && s.length > 0)
  } catch (err) {
    console.error('sitemap: slug fetch failed:', err instanceof Error ? err.message : err)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseURL().replace(/\/$/, '')
  const now = new Date()

  const [news, kudos, media, issues, sections, programs] = await Promise.all([
    slugs(getNewsArticleSlugs),
    slugs(getKudosSlugs),
    slugs(getMediaGallerySlugs),
    slugs(getNewsletterIssueSlugs),
    slugs(getNewsletterSectionSlugs),
    slugs(getProgramPageSlugs),
  ])

  const entry = (
    path: string,
    priority: number,
    changeFrequency: Entry['changeFrequency']
  ): Entry => ({ url: `${base}${path}`, lastModified: now, changeFrequency, priority })

  return [
    ...STATIC_ROUTES.map(([p, pr, cf]) => entry(p, pr, cf)),
    ...programs.map((s) => entry(`/programs/${s}`, 0.8, 'monthly')),
    ...news.map((s) => entry(`/news/${s}`, 0.6, 'monthly')),
    ...issues.map((s) => entry(`/newsletter/${s}`, 0.5, 'yearly')),
    ...sections.map((s) => entry(`/newsletter/sections/${s}`, 0.4, 'yearly')),
    ...kudos.map((s) => entry(`/kudos/${s}`, 0.4, 'yearly')),
    ...media.map((s) => entry(`/media/${s}`, 0.4, 'yearly')),
  ]
}
