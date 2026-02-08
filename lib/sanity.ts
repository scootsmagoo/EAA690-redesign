import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

// Sanity client configuration
// You'll need to create a Sanity project at sanity.io and get these values
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
})

// Image URL builder for Sanity images
const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// ============================================
// GROQ Queries
// ============================================

// Fetch all upcoming events (sorted by date)
export async function getUpcomingEvents() {
  return sanityClient.fetch(`
    *[_type == "event" && date >= now()] | order(date asc) {
      _id,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      image
    }
  `)
}

// Fetch a single event by slug
export async function getEventBySlug(slug: string) {
  return sanityClient.fetch(`
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
  `, { slug })
}

// Fetch all news articles (sorted by date, newest first)
export async function getNewsArticles(limit?: number) {
  const limitClause = limit ? `[0...${limit}]` : ''
  return sanityClient.fetch(`
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
export async function getNewsArticleBySlug(slug: string) {
  return sanityClient.fetch(`
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
  `, { slug })
}

// Fetch presentations/speakers
export async function getPresentations(limit?: number) {
  const limitClause = limit ? `[0...${limit}]` : ''
  return sanityClient.fetch(`
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
  return sanityClient.fetch(`
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
  return sanityClient.fetch(`
    *[_type == "page" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      content,
      seo
    }
  `, { slug })
}

// Fetch site settings (logo, contact info, social links, etc.)
export async function getSiteSettings() {
  return sanityClient.fetch(`
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
      newsletterUrl
    }
  `)
}

// Fetch board members
export async function getBoardMembers() {
  return sanityClient.fetch(`
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
