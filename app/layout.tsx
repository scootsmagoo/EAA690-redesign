import type { Metadata } from 'next'
import { PT_Serif } from 'next/font/google'
import './globals.css'
import SiteChrome from '@/components/SiteChrome'

const ptSerif = PT_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-serif',
  display: 'swap',
  fallback: ['serif'],
})

export const metadata: Metadata = {
  title: 'EAA 690 - Experimental Aircraft Association Chapter 690',
  description: 'EAA 690 is a Chapter of the Experimental Aircraft Association, located at Briscoe Field (KLZU) in Lawrenceville, Georgia.',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ptSerif.className} suppressHydrationWarning>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
