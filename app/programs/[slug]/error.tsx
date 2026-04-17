'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Catches render errors under /programs/[slug] (e.g. malformed CMS portable text)
 * so the client does not surface a generic “Failed to fetch” from a failed RSC response.
 */
export default function ProgramSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[programs/[slug]]', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-eaa-blue mb-3">Something went wrong</h1>
      <p className="text-gray-700 mb-6">
        This program page could not be loaded. You can try again, or return to the programs list.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex justify-center rounded-md bg-eaa-blue px-5 py-2.5 text-white font-semibold hover:bg-eaa-light-blue"
        >
          Try again
        </button>
        <Link
          href="/programs"
          className="inline-flex justify-center rounded-md border border-eaa-blue px-5 py-2.5 text-eaa-blue font-semibold hover:bg-gray-50"
        >
          All programs
        </Link>
      </div>
    </div>
  )
}
