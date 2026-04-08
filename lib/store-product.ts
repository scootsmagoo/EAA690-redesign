import type { StoreProduct } from '@/lib/sanity-types'

const STRIPE_PRICE_ID_RE = /^price_[A-Za-z0-9]{8,}$/

/** True when the product can be sold on this site (cart + Stripe Checkout). */
export function productCanCheckoutOnSite(p: StoreProduct): boolean {
  if (p.stripePriceId && STRIPE_PRICE_ID_RE.test(p.stripePriceId.trim())) return true
  const cents = p.unitAmountCents
  if (typeof cents === 'number' && Number.isInteger(cents) && cents >= 50 && cents <= 500_000) return true
  return false
}
