import type { Metadata } from 'next'
import { PT_Serif, Cormorant_Garamond } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import SiteChrome from '@/components/SiteChrome'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeNoFlickerScript } from '@/components/ThemeNoFlickerScript'
import { getSiteSettings, getProgramNavItems } from '@/lib/sanity'
import { getAnnouncementBar } from '@/lib/site-settings-display'
import { PROGRAM_NAV_FALLBACK } from '@/lib/program-nav-fallback'
import { RESOLVED_THEME_COOKIE, THEME_COOKIE, type ResolvedTheme } from '@/lib/preferences'

const ptSerif = PT_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-serif',
  display: 'swap',
  fallback: ['serif'],
})

// Display serif used for the /kudos hero overlay (closest free analogue to
// Minerva Modern, which is paid Adobe Fonts only). Exposed as a CSS var so
// the body's default PT Serif stack is unaffected.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
  fallback: ['Cormorant', 'Georgia', 'Times New Roman', 'serif'],
})

export const metadata: Metadata = {
  title: 'EAA 690 - Experimental Aircraft Association Chapter 690',
  description: 'EAA 690 is a Chapter of the Experimental Aircraft Association, located at Briscoe Field (KLZU) in Lawrenceville, Georgia.',
  icons: {
    icon: '/logo.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteSettings = await getSiteSettings()
  const announcement = getAnnouncementBar(siteSettings?.siteAnnouncement)
  const showStore = siteSettings?.storeSectionVisible !== false

  let programNavItems = await getProgramNavItems()
  if (programNavItems.length === 0) {
    programNavItems = PROGRAM_NAV_FALLBACK
  }

  // Read the user's resolved theme from a cookie so first paint matches what
  // the no-flicker script will set. Falls back to "light" for fresh visitors;
  // the in-head script reconciles against prefers-color-scheme on hydration.
  const cookieStore = await cookies()
  const resolved = cookieStore.get(RESOLVED_THEME_COOKIE)?.value
  const initialResolved: ResolvedTheme = resolved === 'dark' ? 'dark' : 'light'
  const themePref = cookieStore.get(THEME_COOKIE)?.value ?? 'system'

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${initialResolved === 'dark' ? 'dark' : ''}`.trim()}
      data-theme={themePref}
      data-resolved-theme={initialResolved}
      style={{ colorScheme: initialResolved }}
      suppressHydrationWarning
    >
      <head>
        <ThemeNoFlickerScript />
      </head>
      <body className={ptSerif.className} suppressHydrationWarning>
        <ThemeProvider initialResolvedTheme={initialResolved}>
          <SiteChrome announcement={announcement} showStore={showStore} programNavItems={programNavItems}>
            {children}
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  )
}
