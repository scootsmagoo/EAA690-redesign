'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { StoreCartProvider } from '@/components/StoreCartProvider'

/**
 * Renders global nav + footer for the public site only. `/studio` embeds Sanity
 * NextStudio full-screen — the site chrome would stack under Studio toolbars and
 * break dropdown z-order; omit it there.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-eaa-blue focus:text-white focus:rounded-md focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navigation />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </StoreCartProvider>
  )
}
