import type { StoreProduct } from '@/lib/sanity-types'
import { isValidStoreProductId } from '@/lib/store-ids'
import { productCanCheckoutOnSite } from '@/lib/store-product'

/** v2: server resolves Stripe Price / cents from catalog by productId */
export const STORE_CART_STORAGE_KEY = 'eaa690-store-cart-v2'
const LEGACY_CART_STORAGE_KEY = 'eaa690-store-cart-v1'

export type CartLine = {
  productId: string
  title: string
  priceDisplay: string
  quantity: number
}

const MAX_QTY_PER_LINE = 10
const MAX_LINES = 30

function parseCartLines(parsed: unknown): CartLine[] {
  if (!Array.isArray(parsed)) return []
  const lines: CartLine[] = []
  for (const row of parsed) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const productId = typeof r.productId === 'string' ? r.productId : ''
    const title = typeof r.title === 'string' ? r.title : 'Item'
    const priceDisplay = typeof r.priceDisplay === 'string' ? r.priceDisplay : ''
    const q = typeof r.quantity === 'number' && Number.isFinite(r.quantity) ? Math.floor(r.quantity) : 0
    if (!productId || !isValidStoreProductId(productId) || q < 1) continue
    lines.push({
      productId,
      title,
      priceDisplay,
      quantity: Math.min(q, MAX_QTY_PER_LINE),
    })
  }
  return lines.slice(0, MAX_LINES)
}

/** Migrate old lines that required stripePriceId — same shape as v2 minus server fields. */
function migrateLegacyV1Json(parsed: unknown): CartLine[] {
  return parseCartLines(parsed)
}

export function loadCartFromStorage(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const rawV2 = window.localStorage.getItem(STORE_CART_STORAGE_KEY)
    if (rawV2) return parseCartLines(JSON.parse(rawV2))

    const rawV1 = window.localStorage.getItem(LEGACY_CART_STORAGE_KEY)
    if (rawV1) {
      const migrated = migrateLegacyV1Json(JSON.parse(rawV1))
      window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
      if (migrated.length > 0) {
        saveCartToStorage(migrated)
      }
      return migrated
    }
    return []
  } catch {
    return []
  }
}

export function saveCartToStorage(lines: CartLine[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORE_CART_STORAGE_KEY, JSON.stringify(lines))
  } catch {
    // ignore quota / private mode
  }
}

export function countCartItems(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}

export function addProductToLines(lines: CartLine[], product: StoreProduct, qty: number): CartLine[] {
  if (!productCanCheckoutOnSite(product)) return lines
  const add = Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(qty)))
  const idx = lines.findIndex((l) => l.productId === product._id)
  if (idx >= 0) {
    const next = [...lines]
    const merged = Math.min(MAX_QTY_PER_LINE, next[idx].quantity + add)
    next[idx] = { ...next[idx], quantity: merged }
    return next
  }
  if (lines.length >= MAX_LINES) return lines
  return [
    ...lines,
    {
      productId: product._id,
      title: product.title,
      priceDisplay: product.priceDisplay,
      quantity: add,
    },
  ]
}

export function setLineQuantity(lines: CartLine[], productId: string, quantity: number): CartLine[] {
  const q = Math.max(0, Math.min(MAX_QTY_PER_LINE, Math.floor(quantity)))
  return lines
    .map((l) => (l.productId === productId ? { ...l, quantity: q } : l))
    .filter((l) => l.quantity > 0)
}

export function removeLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((l) => l.productId !== productId)
}
