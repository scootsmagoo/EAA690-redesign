'use client'

export type StoreCartCheckoutItem = { productId: string; quantity: number }

const MAX_ERROR_CHARS = 280

function clipPublicError(message: string): string {
  const t = message.replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (t.length <= MAX_ERROR_CHARS) return t
  return `${t.slice(0, MAX_ERROR_CHARS - 1)}…`
}

export async function startStoreCartCheckout(items: StoreCartCheckoutItem[]): Promise<void> {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'store_cart', items }),
    credentials: 'same-origin',
    cache: 'no-store',
  })
  const text = await res.text()
  let data: { url?: string; error?: string } = {}
  if (text) {
    try {
      data = JSON.parse(text) as { url?: string; error?: string }
    } catch {
      throw new Error(res.ok ? 'Invalid response from server' : `Server error (${res.status})`)
    }
  }
  if (!res.ok || !data.url) {
    const raw = data.error ?? `Checkout failed (${res.status})`
    throw new Error(clipPublicError(raw))
  }
  window.location.href = data.url
}
