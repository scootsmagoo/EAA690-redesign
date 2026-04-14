import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per serverless instance).
// For multi-instance deployments, swap for Vercel KV / Redis if needed.
// ---------------------------------------------------------------------------
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

// ---------------------------------------------------------------------------
// Email validation — same pattern as OWASP recommendation
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

const MAX_BODY_BYTES = 4_096

export async function POST(request: NextRequest) {
  // Payload size guard
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 })
  }

  // IP-based rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  // Parse body
  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Could not read request body.' }, { status: 400 })
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 })
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot check — bots fill hidden fields; real users leave them empty
  if (typeof data.website === 'string' && data.website.trim() !== '') {
    // Silent success: don't reveal bot detection to scrapers
    return NextResponse.json({ success: true }, { status: 200 })
  }

  // Server-side email validation
  const email =
    typeof data.email === 'string' ? data.email.trim().toLowerCase().slice(0, 254) : ''
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // Mailchimp credentials
  const apiKey = process.env.MAILCHIMP_API_KEY?.trim()
  const listId = process.env.MAILCHIMP_LIST_ID?.trim()

  if (!apiKey || !listId) {
    // Not yet configured — let the org know via server log; visitor gets a friendly message
    console.warn('newsletter/subscribe: MAILCHIMP_API_KEY or MAILCHIMP_LIST_ID is not set.')
    return NextResponse.json(
      { error: 'Newsletter signup is not yet configured. Please check back soon.' },
      { status: 503 }
    )
  }

  // Mailchimp datacenter is the suffix after the last dash in the API key (e.g. "us1")
  const dc = apiKey.split('-').pop() ?? 'us1'
  const mcUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`

  let mcRes: Response
  try {
    mcRes = await fetch(mcUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
      }),
    })
  } catch (err) {
    console.error('newsletter/subscribe: Mailchimp fetch error:', err)
    return NextResponse.json(
      { error: 'Could not connect to mailing list. Please try again.' },
      { status: 502 }
    )
  }

  // Member already exists — treat as success so we don't reveal subscriber status
  if (mcRes.status === 400) {
    const body = await mcRes.json().catch(() => ({}))
    if ((body as { title?: string }).title === 'Member Exists') {
      return NextResponse.json({ success: true }, { status: 200 })
    }
    console.error('newsletter/subscribe: Mailchimp 400:', body)
    return NextResponse.json(
      { error: 'Unable to subscribe. Please try again.' },
      { status: 400 }
    )
  }

  if (!mcRes.ok) {
    console.error('newsletter/subscribe: Mailchimp error:', mcRes.status)
    return NextResponse.json(
      { error: 'Unable to subscribe. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
