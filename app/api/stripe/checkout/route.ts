import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSiteBaseURL } from '@/lib/site-url'
import { resolveMembershipLineItems, type MembershipTier } from '@/lib/membership-checkout'
import { loadStoreCatalog } from '@/lib/store'
import { STORE_PRODUCT_ID_RE } from '@/lib/store-ids'

export type CheckoutType = 'donation' | 'membership' | 'store_product' | 'store_cart'

interface CheckoutBody {
  type: CheckoutType
  // Donation — amount in whole dollars (e.g. 25 = $25.00)
  amount?: number
  // Membership — 'student' | 'individual' | 'family'
  membershipTier?: string
  // Store product — Price ID from Sanity stripePriceId field
  stripePriceId?: string
  quantity?: number
  /** Store cart — product IDs resolved against the published catalog (amounts cannot be tampered with). */
  items?: { productId: string; quantity: number }[]
}

// ─── Validation constants ──────────────────────────────────────────────────────

const VALID_CHECKOUT_TYPES = new Set<CheckoutType>([
  'donation',
  'membership',
  'store_product',
  'store_cart',
])
const STORE_CART_MAX_LINES = 30
const VALID_MEMBERSHIP_TIERS = new Set(['student', 'individual', 'family'])
const DONATION_MIN_USD = 1
const DONATION_MAX_USD = 10_000
const QUANTITY_MIN = 1
const QUANTITY_MAX = 10
// Stripe Price IDs are always "price_" followed by alphanumeric characters
const STRIPE_PRICE_ID_RE = /^price_[A-Za-z0-9]{8,}$/
const UNIT_AMOUNT_MIN_CENTS = 50
const UNIT_AMOUNT_MAX_CENTS = 500_000

/** OWASP: limit JSON body size before parse (DoS / resource exhaustion). */
const MAX_BODY_BYTES = 65_536

// ─── Simple in-memory rate limiter ────────────────────────────────────────────
// Limits checkout session creation to 10 requests per IP per minute.
// Note: for multi-instance / serverless deployments this only protects
// within a single process. Replace with Upstash Redis for global limiting.

const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 10
const _rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = _rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    _rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate-limit by IP (x-forwarded-for on Vercel; remoteAddress elsewhere)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 }
    )
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 })
  }

  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let body: CheckoutBody
  try {
    body = raw ? (JSON.parse(raw) as CheckoutBody) : ({} as CheckoutBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { type } = body

  // Validate type before anything else so we never process unknown types
  if (!type || !VALID_CHECKOUT_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 })
  }

  try {
    const base = getSiteBaseURL()
    const stripe = getStripe()
    // ── Donation ────────────────────────────────────────────────────────────
    if (type === 'donation') {
      const dollars = body.amount
      if (
        typeof dollars !== 'number' ||
        !Number.isFinite(dollars) ||
        dollars < DONATION_MIN_USD ||
        dollars > DONATION_MAX_USD
      ) {
        return NextResponse.json(
          { error: `Donation amount must be between $${DONATION_MIN_USD} and $${DONATION_MAX_USD}.` },
          { status: 400 }
        )
      }
      const cents = Math.round(dollars * 100)

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: cents,
              product_data: {
                name: 'Donation — EAA Chapter 690',
                description: 'Tax-deductible donation to EAA Chapter 690 (501(c)(3))',
                images: [`${base}/logo.png`],
              },
            },
          },
        ],
        submit_type: 'donate',
        success_url: `${base}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/donate`,
        metadata: { type: 'donation' },
      })

      return NextResponse.json({ url: session.url })
    }

    // ── Membership ──────────────────────────────────────────────────────────
    if (type === 'membership') {
      const tier = body.membershipTier

      if (!tier || !VALID_MEMBERSHIP_TIERS.has(tier)) {
        return NextResponse.json({ error: 'Invalid membership tier.' }, { status: 400 })
      }

      const resolved = await resolveMembershipLineItems(tier as MembershipTier)
      if (!resolved.ok) {
        return NextResponse.json(
          { error: 'Membership pricing is not configured yet. Please contact us.' },
          { status: 503 }
        )
      }

      const session = await stripe.checkout.sessions.create({
        mode: resolved.mode,
        line_items: resolved.line_items,
        allow_promotion_codes: true,
        success_url: `${base}/join/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/join`,
        metadata: { type: 'membership', tier },
      })

      return NextResponse.json({ url: session.url })
    }

    // ── Store product ───────────────────────────────────────────────────────
    if (type === 'store_product') {
      const priceId = body.stripePriceId

      // Validate Price ID format — prevents injecting arbitrary IDs
      if (!priceId || !STRIPE_PRICE_ID_RE.test(priceId)) {
        return NextResponse.json({ error: 'Invalid product price reference.' }, { status: 400 })
      }

      const rawQty = body.quantity ?? 1
      const quantity =
        Number.isInteger(rawQty) && rawQty >= QUANTITY_MIN && rawQty <= QUANTITY_MAX
          ? rawQty
          : null
      if (quantity === null) {
        return NextResponse.json(
          { error: `Quantity must be between ${QUANTITY_MIN} and ${QUANTITY_MAX}.` },
          { status: 400 }
        )
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity }],
        success_url: `${base}/store/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/store`,
        metadata: { type: 'store_product' },
      })

      return NextResponse.json({ url: session.url })
    }

    // ── Store cart (catalog-resolved Stripe Prices and/or ad-hoc line amounts) ─
    if (type === 'store_cart') {
      const rawItems = body.items
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        return NextResponse.json({ error: 'Cart is empty or invalid.' }, { status: 400 })
      }
      if (rawItems.length > STORE_CART_MAX_LINES) {
        return NextResponse.json({ error: 'Too many distinct items in cart.' }, { status: 400 })
      }

      const qtyMerged = new Map<string, number>()
      for (const row of rawItems) {
        if (!row || typeof row !== 'object') {
          return NextResponse.json({ error: 'Invalid cart line.' }, { status: 400 })
        }
        const productId = (row as { productId?: string }).productId
        const rawQty = (row as { quantity?: unknown }).quantity
        if (!productId || typeof productId !== 'string' || !STORE_PRODUCT_ID_RE.test(productId)) {
          return NextResponse.json({ error: 'Invalid product reference in cart.' }, { status: 400 })
        }
        const q =
          typeof rawQty === 'number' && Number.isInteger(rawQty) && rawQty >= QUANTITY_MIN && rawQty <= QUANTITY_MAX
            ? rawQty
            : null
        if (q === null) {
          return NextResponse.json(
            { error: `Each line quantity must be between ${QUANTITY_MIN} and ${QUANTITY_MAX}.` },
            { status: 400 }
          )
        }
        qtyMerged.set(productId, Math.min(QUANTITY_MAX, (qtyMerged.get(productId) ?? 0) + q))
      }

      const { products } = await loadStoreCatalog()
      const byId = new Map(products.map((p) => [p._id, p]))

      const line_items: Array<
        | { price: string; quantity: number }
        | {
            quantity: number
            price_data: {
              currency: 'usd'
              unit_amount: number
              product_data: { name: string }
            }
          }
      > = []
      for (const [productId, quantity] of Array.from(qtyMerged.entries())) {
        const p = byId.get(productId)
        if (!p) {
          return NextResponse.json(
            { error: 'One or more products are no longer available. Refresh the store and try again.' },
            { status: 400 }
          )
        }

        const priceId = p.stripePriceId?.trim()
        if (priceId && STRIPE_PRICE_ID_RE.test(priceId)) {
          line_items.push({ price: priceId, quantity })
          continue
        }

        const cents = p.unitAmountCents
        if (
          typeof cents === 'number' &&
          Number.isInteger(cents) &&
          cents >= UNIT_AMOUNT_MIN_CENTS &&
          cents <= UNIT_AMOUNT_MAX_CENTS
        ) {
          line_items.push({
            quantity,
            price_data: {
              currency: 'usd',
              unit_amount: cents,
              product_data: {
                name: p.title.slice(0, 250),
              },
            },
          })
          continue
        }

        return NextResponse.json(
          { error: `${p.title} is not available for checkout on this site.` },
          { status: 400 }
        )
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items,
        success_url: `${base}/store/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/store/cart`,
        metadata: { type: 'store_cart', line_count: String(line_items.length) },
      })

      return NextResponse.json({ url: session.url })
    }
  } catch (error) {
    console.error('Stripe checkout error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'Payment system is not configured. Please try again later.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }
}
