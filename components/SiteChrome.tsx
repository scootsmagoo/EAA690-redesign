'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { StoreCartProvider } from '@/components/StoreCartProvider'
import SiteAnnouncementBar from '@/components/SiteAnnouncementBar'
import type { AnnouncementBarProps } from '@/lib/site-settings-display'
import type { ProgramNavRow } from '@/lib/sanity'

/**
 * Renders global nav + footer for the public site only. `/studio` embeds Sanity
 * NextStudio full-screen — the site chrome would stack under Studio toolbars and
 * break dropdown z-order; omit it there.
 */
export default function SiteChrome({
  children,
  announcement = null,
  showStore = true,
  programNavItems,
}: {
  children: React.ReactNode
  announcement?: AnnouncementBarProps | null
  showStore?: boolean
  /** When set, drives the Programs dropdown (from CMS + layout fallback). */
  programNavItems?: ProgramNavRow[]
}) {
  const pathname = usePathname()
  const isStudio = pathname?.startsWith('/studio') ?? false

  if (isStudio) {
    return (
      <div className="min-h-screen bg-black">
        {children}
      </div>
    )
  }

  return (
    <StoreCartProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-eaa-blue focus:text-white dark:focus:bg-eaa-yellow dark:focus:text-eaa-blue focus:rounded-md focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navigation showStore={showStore} programNavItems={programNavItems} />
      {announcement ? <SiteAnnouncementBar {...announcement} /> : null}
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </StoreCartProvider>
  )
}
