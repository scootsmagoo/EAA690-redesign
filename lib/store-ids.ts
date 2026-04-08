/** Sanity `_id` values and static fallback ids (aligned with checkout API validation). */
export const STORE_PRODUCT_ID_RE = /^[-_.a-zA-Z0-9]{4,256}$/

export function isValidStoreProductId(id: string): boolean {
  return typeof id === 'string' && STORE_PRODUCT_ID_RE.test(id)
}
