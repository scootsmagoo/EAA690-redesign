/**
 * Simple in-memory rate limiter for form POSTs (best-effort on serverless).
 * Key should be client IP (or similar).
 */

type Bucket = { t: number[] }

const buckets = new Map<string, Bucket>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 8
const MAX_BUCKETS = 2000

function prune(key: string, now: number) {
  const b = buckets.get(key)
  if (!b) return
  b.t = b.t.filter((ts) => now - ts < WINDOW_MS)
  if (b.t.length === 0) buckets.delete(key)
}

/** Returns true if under limit (request may proceed). */
export function allowFormSubmission(key: string): boolean {
  const now = Date.now()
  const k = key.slice(0, 128) || 'unknown'
  prune(k, now)

  if (buckets.size > MAX_BUCKETS) {
    const half = Array.from(buckets.keys()).slice(0, Math.floor(MAX_BUCKETS / 2))
    for (const x of half) buckets.delete(x)
  }

  const b = buckets.get(k) ?? { t: [] }
  b.t = b.t.filter((ts) => now - ts < WINDOW_MS)
  if (b.t.length >= MAX_REQUESTS) {
    buckets.set(k, b)
    return false
  }
  b.t.push(now)
  buckets.set(k, b)
  return true
}
