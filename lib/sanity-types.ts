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
