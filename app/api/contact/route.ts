import { NextRequest, NextResponse } from 'next/server'
import { parseContactPayload } from '@/lib/contact-email'
import { notifyContactFormSubmission } from '@/lib/form-notifications'
import { allowFormSubmission } from '@/lib/form-rate-limit'
import { insertContactSubmission } from '@/lib/forms-db'

const MAX_BODY_BYTES = 32_768

function clientIp(request: NextRequest): string {
  const xf = request.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0]?.trim().slice(0, 128) || 'unknown'
  return request.headers.get('x-real-ip')?.trim().slice(0, 128) || 'unknown'
}

export async function POST(request: NextRequest) {
  // OWASP: per-IP throttle so the contact form can't be used as an outbound
  // spam relay or to flood the chapter inbox via Resend.
  if (!allowFormSubmission(`contact:${clientIp(request)}`)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
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

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
  }

  if (typeof data.website === 'string' && data.website.trim() !== '') {
    return NextResponse.json({ success: true }, { status: 201 })
  }

  const parsed = parseContactPayload(data)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const asRecord = { ...parsed.payload } as unknown as Record<string, unknown>
  let savedId: string
  try {
    savedId = await insertContactSubmission(asRecord)
  } catch (err) {
    console.error('Contact form: failed to save message:', err)
    return NextResponse.json(
      { error: 'Could not save your message. Please try again or email info@eaa690.org directly.' },
      { status: 500 }
    )
  }

  void notifyContactFormSubmission(parsed.payload).catch((err) => {
    console.error('Contact form: notification failed (message stored as id=%s):', savedId, err)
  })

  return NextResponse.json({ success: true, id: savedId }, { status: 200 })
}
