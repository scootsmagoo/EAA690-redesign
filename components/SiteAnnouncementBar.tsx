'use client'

import Link from 'next/link'
import type { AnnouncementBarProps } from '@/lib/site-settings-display'
import { safePortableTextLinkHref } from '@/lib/search-safety'

const variantClasses: Record<AnnouncementBarProps['variant'], string> = {
  info: 'bg-sky-50 text-sky-950 border-b border-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-900',
  warning:
    'bg-amber-50 text-amber-950 border-b border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900',
  neutral:
    'bg-gray-100 text-gray-900 border-b border-gray-200 dark:bg-eaa-surface-dark dark:text-gray-100 dark:border-eaa-border-dark',
}

export default function SiteAnnouncementBar({
  message,
  linkUrl,
  linkText,
  variant,
}: AnnouncementBarProps) {
  const bar = variantClasses[variant] ?? variantClasses.info
  /**
   * OWASP A03 (Injection / DOM XSS) + open-redirect hardening: linkUrl comes
   * from the Sanity CMS and is editor-supplied. Reject `javascript:`, `data:`,
   * `vbscript:`, protocol-relative `//`, and other unsafe schemes. Allow only
   * same-origin paths or absolute http(s) URLs.
   */
  const safeHref = linkUrl ? safePortableTextLinkHref(linkUrl) : null
  const isExternal = safeHref?.startsWith('http://') || safeHref?.startsWith('https://')
  const linkLabel = linkText?.trim() || 'Learn more'

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className={`w-full px-4 py-2.5 text-center text-sm ${bar}`}
    >
      <span className="inline-block max-w-4xl">{message}</span>
      {safeHref ? (
        <>
          {' '}
          {isExternal ? (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:opacity-80 whitespace-nowrap"
            >
              {linkLabel}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link
              href={safeHref}
              className="font-semibold underline underline-offset-2 hover:opacity-80 whitespace-nowrap"
            >
              {linkLabel}
            </Link>
          )}
        </>
      ) : null}
    </div>
  )
}
