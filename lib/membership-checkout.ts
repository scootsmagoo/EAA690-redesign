import { loadStoreCatalog } from '@/lib/store'

export type MembershipTier = 'student' | 'individual' | 'family'

/** Slug `slug.current` for each tier — must match store catalog / Sanity. */
export const MEMBERSHIP_SLUG_BY_TIER: Record<MembershipTier, string> = {
  student: 'student-membership',
  individual: 'individual-membership',
  family: 'family-membership',
}

export const MEMBERSHIP_MODE: Record<MembershipTier, 'payment' | 'subscription'> = {
  student: 'payment',
  individual: 'subscription',
  family: 'subscription',
}

const STRIPE_PRICE_ID_RE = /^price_[A-Za-z0-9]{8,}$/
const UNIT_AMOUNT_MIN_CENTS = 50
const UNIT_AMOUNT_MAX_CENTS = 500_000

const MEMBERSHIP_ENV_PRICE: Record<MembershipTier, string | undefined> = {
  student: process.env.STRIPE_PRICE_STUDENT_MEMBERSHIP,
  individual: process.env.STRIPE_PRICE_INDIVIDUAL_MEMBERSHIP,
  family: process.env.STRIPE_PRICE_FAMILY_MEMBERSHIP,
}

/**
 * Resolves Stripe Checkout line items for chapter membership.
 * Order: dedicated env Price IDs → same products in the store catalog (Sanity or fallback).
 */
export async function resolveMembershipLineItems(tier: MembershipTier) {
  const mode = MEMBERSHIP_MODE[tier]

  const fromEnv = MEMBERSHIP_ENV_PRICE[tier]?.trim()
  if (fromEnv && STRIPE_PRICE_ID_RE.test(fromEnv)) {
    return {
      ok: true,
      mode,
      line_items: [{ price: fromEnv, quantity: 1 }],
    }
  }

  const { products } = await loadStoreCatalog()
  const slug = MEMBERSHIP_SLUG_BY_TIER[tier]
  const product = products.find((p) => p.slug?.current === slug)
  if (!product) {
    return { ok: false }
  }

  const priceId = product.stripePriceId?.trim()
  if (priceId && STRIPE_PRICE_ID_RE.test(priceId)) {
    return {
      ok: true,
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
    }
  }

  const cents = product.unitAmountCents
  if (
    typeof cents !== 'number' ||
    !Number.isInteger(cents) ||
    cents < UNIT_AMOUNT_MIN_CENTS ||
    cents > UNIT_AMOUNT_MAX_CENTS
  ) {
    return { ok: false }
  }

  const lineItem = {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: cents,
      product_data: {
        name: product.title.slice(0, 250),
        ...(product.shortDescription
          ? { description: product.shortDescription.slice(0, 500) }
          : {}),
      },
      ...(mode === 'subscription'
        ? { recurring: { interval: 'year' as const } }
        : {}),
    },
  }

  return { ok: true, mode, line_items: [lineItem] }
}
