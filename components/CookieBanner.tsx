'use client'

import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const choice = localStorage.getItem('cookie-consent')
    if (!choice) setVisible(true)
  }, [])

  const dismiss = (choice: 'accepted' | 'declined') => {
    localStorage.setItem('cookie-consent', choice)
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
