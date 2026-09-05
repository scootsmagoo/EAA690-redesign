// TypeScript types for Sanity content

export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
}

export type EventType = 'breakfast' | 'flyout' | 'young-eagles' | 'meeting' | 'special' | 'general'

export interface Event {
  _id: string
  title: string
  slug?: { current: string }
  date: string
  startTime?: string
  endTime?: string
  location: string
  description?: string
  content?: any[]
  image?: SanityImage
  isRecurring?: boolean
  recurringInfo?: string
  eventType?: EventType
}

export interface NewsArticle {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  author?: string
  excerpt?: string
  content?: any[]
  image?: SanityImage
}

export interface HomeProgramCard {
  icon?: string
  name?: string
  description?: string
  href?: string
  cta?: string
}

/** Singleton `homePage` — see sanity/schemas/homePage.ts */
export interface HomePageContent {
  _id?: string
  heroHeadline?: string
  heroIntro?: unknown[]
  /** `goldBadge` is legacy CMS value — treated as programs panel on the public site. */
  heroVisual?: 'programsPanel' | 'heroImage' | 'goldBadge'
  heroImage?: SanityImage
  /** Screen reader label for hero photo (when heroVisual is heroImage). */
  heroImageAlt?: string
  programsSectionTitle?: string
  programsSectionSubtitle?: string
  programCards?: HomeProgramCard[]
  pancakeSectionEnabled?: boolean
  pancakeTitle?: string
  pancakeIntro?: string
  pancakeBreakfastTime?: string
  pancakeProgramTime?: string
  pancakePriceNote?: string
  spotlightEnabled?: boolean
  spotlightTitle?: string
  spotlightSubtitle?: string
  spotlightImage?: SanityImage
  /** Preferred alt for spotlight photo; headings used as fallback in UI. */
  spotlightImageAlt?: string
  spotlightBody?: unknown[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

// ── Media ──────────────────────────────────────────────────────────────────────

export type MediaDisplayType = 'slideshow' | 'imageGrid' | 'videoEmbed'

export interface MediaGalleryImage {
  _key?: string
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  hotspot?: { x: number; y: number; height: number; width: number }
  alt?: string
  caption?: string
}

/** Card data returned by getMediaGalleries() for the /media index. */
export interface MediaGalleryCard {
  _id: string
  title: string
  slug: { current: string }
  publishedAt?: string
  coverImage?: SanityImage
  coverImageAlt?: string
  description?: string
  displayType: MediaDisplayType
  imageCount?: number
}

/** Full document returned by getMediaGalleryBySlug(). */
export interface MediaGallery {
  _id: string
  title: string
  slug: { current: string }
  publishedAt?: string
  coverImage?: SanityImage
  coverImageAlt?: string
  description?: string
  richDescription?: unknown[]
  displayType: MediaDisplayType
  images?: MediaGalleryImage[]
  videoUrl?: string
  videoTitle?: string
  videoSubtitle?: string
}

/** Singleton mediaPage — see sanity/schemas/mediaPage.ts */
export interface MediaPageContent {
  _id?: string
  heroImage?: SanityImage
  heroImageAlt?: string
  pageTitle?: string
  pageDescription?: string
}

export interface StoreCategory {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  sortOrder?: number
}

export interface StoreProduct {
  _id: string
  title: string
  slug: { current: string }
  priceDisplay: string
  shortDescription?: string
  descriptionRich?: any[]
  image?: SanityImage
  categories: StoreCategory[]
  externalPurchaseUrl?: string
  stripePriceId?: string
  /** Whole USD cents for one-time Stripe Checkout when no Stripe Price ID (server-validated). */
  unitAmountCents?: number
  sortOrder?: number
  isActive?: boolean
}
