'use client'

import { Suspense, use, useState } from 'react'
import { browser } from 'react-dom'

const CONSENT_KEY = 'cookie-consent'

function readConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY)
  } catch {
    // Storage disabled (private mode, blocked) — treat as "not yet answered".
    return null
  }
}

/**
 * The banner has no meaningful server output — whether it shows depends on
 * localStorage. React 19.3's `browser()` makes that explicit: `use(browser())`
 * suspends during SSR (the <Suspense> fallback, nothing, is what ships in the
 * HTML) and is a no-op in the browser, so after hydration the consent check
 * happens synchronously in the first client render instead of in a mount
 * effect that forces a second render.
 */
function CookieBannerContent() {
  use(browser())
  const [visible, setVisible] = useState(() => readConsent() === null)

  const dismiss = (choice: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(CONSENT_KEY, choice)
    } catch {
      // Storage disabled — hide for this page view anyway.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 bg-gray-800 dark:bg-eaa-bg-dark text-white p-4 shadow-lg z-50 border-t border-gray-700 dark:border-eaa-border-dark"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          By using this website, you agree to our use of cookies. We use cookies to provide you
          with a great experience and to help our website run effectively.
        </p>
        <div className="flex gap-3">
          {/* Explicit dark colors so the global utility-class remap doesn't blend the
              "Accept" button into the already-dark banner. */}
          <button
            onClick={() => dismiss('accepted')}
            className="!bg-white !text-gray-800 dark:!bg-eaa-yellow dark:!text-eaa-blue px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => dismiss('declined')}
            className="bg-gray-700 dark:bg-eaa-surface-dark text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-600 dark:hover:bg-eaa-border-dark transition-colors border border-gray-600 dark:border-eaa-border-dark"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CookieBanner() {
  return (
    <Suspense fallback={null}>
      <CookieBannerContent />
    </Suspense>
  )
}
