'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStoreCart } from '@/components/StoreCartProvider'

/** After Stripe redirects back with session_id, drop persisted cart lines. */
export default function ClearCartOnSuccess() {
  const searchParams = useSearchParams()
  const { clear, ready } = useStoreCart()

  useEffect(() => {
    const sid = searchParams.get('session_id')
    if (ready && sid) clear()
  }, [ready, searchParams, clear])

  return null
}
