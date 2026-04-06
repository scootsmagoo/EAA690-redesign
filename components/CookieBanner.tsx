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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          By using this website, you agree to our use of cookies. We use cookies to provide you
          with a great experience and to help our website run effectively.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => dismiss('accepted')}
            className="bg-white text-gray-800 px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => dismiss('declined')}
            className="bg-gray-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-600 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}
