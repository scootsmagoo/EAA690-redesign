import type { MetadataRoute } from 'next'
import { getSiteBaseURL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteBaseURL().replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/studio', '/members', '/settings', '/account', '/search'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
