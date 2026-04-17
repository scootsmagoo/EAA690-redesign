import { createClient, type SanityClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'

let _client: SanityClient | null | undefined

/**
 * Returns a Sanity client when NEXT_PUBLIC_SANITY_PROJECT_ID is set; otherwise null.
 * Never calls createClient with an empty projectId (that throws and breaks Vercel builds).
 */
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || 'itqpjbjj'
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'

function getSanityClient(): SanityClient | null {
  if (_client !== undefined) return _client
  _client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: process.env.NODE_ENV === 'production',
  })
  return _client
}

export function isSanityConfigured(): boolean {
  return true
}

// Image URL builder for Sanity images
export function urlFor(source: SanityImageSource) {
  const client = getSanityClient()
  if (!client) {
    throw new Error(
      'Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID (and dataset) in the environment.'
    )
  }
  return imageUrlBuilder(client).image(source)
}

// ============================================
// GROQ Queries
// ============================================

// Fetch all upcoming events (sorted by date)
export async function getUpcomingEvents() {
  const client = getSanityClient()
  if (!client) return []
  return client.fetch(`
    *[_type == "event" && date >= now()] | order(date asc) {
      _id,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      eventType,
      isRecurring,
      recurringInfo,
      image
    }
  `)
}

// Fetch all events (past + future) for the calendar widget.
// Uses useCdn:false so freshly published events appear immediately without
// waiting for Sanity's CDN edge cache to propagate.
export async function getAllEvents() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(`
    *[_type == "event"] | order(date asc) {
      _id,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      eventType,
      isRecurring,
      recurringInfo,
      image
    }
  `)
}

// Fetch a single event by slug
export async function getEventBySlug(slug: string) {
  const client = getSanityClient()
  if (!client) return null
  return client.fetch(
    `
    *[_type == "event" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      date,
      startTime,
      endTime,
      description,
      location,
      image,
      content
    }
  `,
    { slug }
  )
}

// Fetch all news articles (sorted by date, newest first)
/** useCdn:false so listing reflects edits immediately; matches {@link getNewsArticleBySlug}. */
export async function getNewsArticles(limit?: number) {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  const limitClause = limit ? `[0...${limit}]` : ''
  return freshClient.fetch(`
    *[_type == "newsArticle"] | order(publishedAt desc) ${limitClause} {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      image,
      author
    }
  `)
}

// Fetch a single news article by slug
/** Uses API directly (no CDN) so new publishes resolve immediately on Vercel; matches {@link getNewsletterIssueBySlug}. */
export async function getNewsArticleBySlug(slug: string) {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(
    `
    *[_type == "newsArticle" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      content,
      image,
      author
    }
  `,
    { slug }
  )
}

/** Slugs for static generation (no CDN so build sees all published slugs). */
export async function getNewsArticleSlugs() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch<Array<{ slug: string }>>(`
    *[_type == "newsArticle" && defined(slug.current)] {
      "slug": slug.current
    }
  `)
}

// Fetch presentations/speakers
export async function getPresentations(limit?: number) {
  const client = getSanityClient()
  if (!client) return []
  const limitClause = limit ? `[0...${limit}]` : ''
  return client.fetch(`
    *[_type == "presentation"] | order(date desc) ${limitClause} {
      _id,
      title,
      date,
      speakerName,
      speakerBio,
      topic,
      image
    }
  `)
}

// Fetch upcoming/featured presentation
export async function getFeaturedPresentation() {
  const client = getSanityClient()
  if (!client) return null
  return client.fetch(`
    *[_type == "presentation" && date >= now()] | order(date asc) [0] {
      _id,
      title,
      date,
      speakerName,
      speakerBio,
      topic,
      image
    }
  `)
}

// Fetch page content by slug (for generic editable pages)
export async function getPageBySlug(slug: string) {
  const client = getSanityClient()
  if (!client) return null
  return client.fetch(
    `
    *[_type == "page" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      content,
      seo
    }
  `,
    { slug }
  )
}

/** Singleton home page content (Studio → Home Page).
 * Uses useCdn:false so published changes appear immediately without
 * waiting for Sanity's edge CDN to propagate.
 */
export async function getHomePage() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(`
    *[_type == "homePage" && _id == "homePage"][0] {
      _id,
      heroHeadline,
      heroIntro,
      heroVisual,
      heroImage,
      heroImageAlt,
      goldBadgeCode,
      programsSectionTitle,
      programsSectionSubtitle,
      programCards[] {
        icon,
        name,
        description,
        href,
        cta
      },
      pancakeSectionEnabled,
      pancakeTitle,
      pancakeIntro,
      pancakeBreakfastTime,
      pancakeProgramTime,
      pancakePriceNote,
      spotlightEnabled,
      spotlightTitle,
      spotlightSubtitle,
      spotlightImage,
      spotlightImageAlt,
      spotlightBody,
      seo
    }
  `)
}

/** Singleton news page settings (Studio → News Page). */
export async function getNewsPage() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(`
    *[_type == "newsPage" && _id == "newsPage"][0] {
      _id,
      heroImage,
      heroImageAlt
    }
  `)
}

// Fetch site settings (logo, contact info, social links, etc.)
export async function getSiteSettings() {
  const client = getSanityClient()
  if (!client) return null
  return client.fetch(`
    *[_type == "siteSettings"][0] {
      siteName,
      tagline,
      logo,
      contactEmail,
      phone,
      address,
      socialLinks,
      breakfastPrice,
      breakfastTime,
      newsletterUrl,
      newsletterArchiveFolderUrl,
      siteAnnouncement,
      storeSectionVisible,
      programForms
    }
  `)
}

const newsletterIssuePdfProjection = `
  pdf {
    asset->{
      url,
      originalFilename
    }
  },
  pdfUrl
`

/** All NAVCOM issues (newest first), for archive pages. */
export async function getNewsletterIssues() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(`
    *[_type == "newsletterIssue"] | order(issueDate desc) {
      _id,
      title,
      slug,
      issueDate,
      volumeLabel,
      excerpt,
      coverImage,
      ${newsletterIssuePdfProjection}
    }
  `)
}

/** Latest issue for home hero and “current” links. */
export async function getLatestNewsletterIssue() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(
    `
    *[_type == "newsletterIssue"] | order(issueDate desc) [0] {
      _id,
      title,
      slug,
      issueDate,
      volumeLabel,
      excerpt,
      coverImage,
      content,
      seoTitle,
      seoDescription,
      ${newsletterIssuePdfProjection}
    }
  `
  )
}

/** Single issue by slug (detail page). */
export async function getNewsletterIssueBySlug(slug: string) {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(
    `
    *[_type == "newsletterIssue" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      issueDate,
      volumeLabel,
      excerpt,
      coverImage,
      content,
      seoTitle,
      seoDescription,
      ${newsletterIssuePdfProjection}
    }
  `,
    { slug }
  )
}

/** Slugs for static generation. */
export async function getNewsletterIssueSlugs() {
  const client = getSanityClient()
  if (!client) return []
  return client.fetch<Array<{ slug: string }>>(`
    *[_type == "newsletterIssue" && defined(slug.current)] {
      "slug": slug.current
    }
  `)
}

// Fetch board members
export async function getBoardMembers() {
  const client = getSanityClient()
  if (!client) return []
  return client.fetch(`
    *[_type == "boardMember"] | order(order asc) {
      _id,
      name,
      role,
      bio,
      image,
      email
    }
  `)
}

// Fetch all kudos entries (sorted by manual order, then date desc)
export async function getKudos() {
  const client = getSanityClient()
  if (!client) return []
  return client.fetch(`
    *[_type == "kudos"] | order(order asc, date desc) {
      _id,
      name,
      slug,
      achievement,
      date,
      excerpt,
      featuredImage,
      "hasGallery": count(gallery) > 0,
      "galleryCount": count(gallery)
    }
  `)
}

// Fetch a single kudos entry by slug
export async function getKudosBySlug(slug: string) {
  const client = getSanityClient()
  if (!client) return null
  return client.fetch(
    `
    *[_type == "kudos" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      achievement,
      date,
      excerpt,
      content,
      featuredImage,
      gallery[] {
        ...,
        caption
      }
    }
  `,
    { slug }
  )
}

// Store: categories for filters (create documents in Studio → Store Categories)
export async function getStoreCategories() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(`
    *[_type == "storeCategory"] | order(sortOrder asc, title asc) {
      _id,
      title,
      slug,
      description,
      sortOrder
    }
  `)
}

// ── Media ──────────────────────────────────────────────────────────────────────

/** Singleton media page settings (Studio → Media Page). */
export async function getMediaPage() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(`
    *[_type == "mediaPage" && _id == "mediaPage"][0] {
      _id,
      heroImage,
      heroImageAlt,
      pageTitle,
      pageDescription
    }
  `)
}

/** All media galleries (newest first) for the /media index listing. */
export async function getMediaGalleries() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(`
    *[_type == "mediaGallery"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      coverImage,
      coverImageAlt,
      description,
      displayType,
      "imageCount": count(images)
    }
  `)
}

/** Single media gallery by slug (detail page). */
export async function getMediaGalleryBySlug(slug: string) {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(
    `
    *[_type == "mediaGallery" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      publishedAt,
      coverImage,
      coverImageAlt,
      description,
      richDescription,
      displayType,
      images[] {
        ...,
        alt,
        caption
      },
      videoUrl,
      videoTitle,
      videoSubtitle
    }
  `,
    { slug }
  )
}

/** Slugs for generateStaticParams on the detail page. */
export async function getMediaGallerySlugs() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch<Array<{ slug: string }>>(`
    *[_type == "mediaGallery" && defined(slug.current)] {
      "slug": slug.current
    }
  `)
}

// Store: products with resolved category refs (useCdn off so new items show quickly)
export async function getStoreProducts() {
  const freshClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  return freshClient.fetch(`
    *[_type == "storeProduct" && (!defined(isActive) || isActive == true)] | order(sortOrder asc, title asc) {
      _id,
      title,
      slug,
      priceDisplay,
      shortDescription,
      descriptionRich,
      image,
      externalPurchaseUrl,
      stripePriceId,
      "unitAmountCents": round(unitAmountDollars * 100),
      sortOrder,
      isActive,
      categories[]->{
        _id,
        title,
        slug,
        description,
        sortOrder
      }
    }
  `)
}

// ── Programs (CMS) ───────────────────────────────────────────────────────────

const freshSanity = () =>
  createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })

/** Avoid crashing RSC client navigation when Sanity is unreachable (shows fallback / 404 instead of “Failed to fetch”). */
async function safeProgramQuery<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  } catch (e) {
    console.error(`[sanity] ${label}:`, e)
    return fallback
  }
}

/** Singleton: /programs listing copy */
export async function getProgramsPageSettings() {
  return safeProgramQuery(
    'getProgramsPageSettings',
    () =>
      freshSanity().fetch(`
    *[_type == "programsPage" && _id == "programsPage"][0] {
      pageTitle,
      intro
    }
  `),
    null
  )
}

/** Singleton: /privacy */
export async function getPrivacyPage() {
  return safeProgramQuery(
    'getPrivacyPage',
    () =>
      freshSanity().fetch(`
    *[_type == "privacyPage" && _id == "privacyPage"][0] {
      title,
      body
    }
  `),
    null
  )
}

export type ProgramNavRow = { name: string; href: string }

/** Programs dropdown: published program pages with showInMainNav. */
export async function getProgramNavItems(): Promise<ProgramNavRow[]> {
  return safeProgramQuery(
    'getProgramNavItems',
    async () => {
      const rows = await freshSanity().fetch<
        Array<{ navLabel: string | null; title: string; slug: { current?: string } | null }>
      >(`
    *[_type == "programPage" && showInMainNav != false] | order(navSortOrder asc, title asc) {
      navLabel,
      title,
      slug
    }
  `)
      return (rows ?? [])
        .map((r) => {
          const slug = r.slug?.current?.trim()
          if (!slug) return null
          const name = (r.navLabel?.trim() || r.title?.trim() || slug).trim()
          return { name, href: `/programs/${slug}` }
        })
        .filter(Boolean) as ProgramNavRow[]
    },
    []
  )
}

export type ProgramIndexRow = { name: string; href: string; description: string }

export async function getProgramsIndexList(): Promise<ProgramIndexRow[]> {
  return safeProgramQuery(
    'getProgramsIndexList',
    async () => {
      const rows = await freshSanity().fetch<
        Array<{
          title: string
          shortDescription?: string | null
          slug: { current?: string } | null
        }>
      >(`
    *[_type == "programPage" && showOnProgramsIndex != false] | order(indexSortOrder asc, title asc) {
      title,
      shortDescription,
      slug
    }
  `)
      return (rows ?? [])
        .map((r) => {
          const slug = r.slug?.current?.trim()
          if (!slug) return null
          const name = r.title?.trim() || slug
          const description = (r.shortDescription?.trim() || '').trim() || 'Chapter aviation program.'
          return { name, href: `/programs/${slug}`, description }
        })
        .filter(Boolean) as ProgramIndexRow[]
    },
    []
  )
}

export async function getProgramPageBySlug(slug: string) {
  return safeProgramQuery(
    'getProgramPageBySlug',
    () =>
      freshSanity().fetch(
        `
    *[_type == "programPage" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      subtitle,
      sections,
      seo
    }
  `,
        { slug }
      ),
    null
  )
}

export async function getProgramPageSlugs() {
  return safeProgramQuery(
    'getProgramPageSlugs',
    () =>
      freshSanity().fetch<Array<{ slug: string }>>(`
    *[_type == "programPage" && defined(slug.current)] {
      "slug": slug.current
    }
  `),
    []
  )
}
