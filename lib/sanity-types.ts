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

export interface Presentation {
  _id: string
  title: string
  date: string
  speakerName: string
  topic?: string
  speakerBio?: any[]
  image?: SanityImage
}

export interface BoardMember {
  _id: string
  name: string
  role: string
  email?: string
  bio?: string
  image?: SanityImage
  order?: number
}

export interface SiteSettings {
  siteName: string
  tagline?: string
  logo?: SanityImage
  contactEmail?: string
  phone?: string
  address?: string
  breakfastPrice?: string
  breakfastTime?: string
  newsletterUrl?: string
  /** Optional Google Drive (or other) folder for pre-migration PDFs. */
  newsletterArchiveFolderUrl?: string
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
  }
}

export interface Page {
  _id: string
  title: string
  slug: { current: string }
  content?: any[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
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
  heroVisual?: 'goldBadge' | 'heroImage'
  heroImage?: SanityImage
  /** Screen reader label for hero photo (when heroVisual is heroImage). */
  heroImageAlt?: string
  goldBadgeCode?: string
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
