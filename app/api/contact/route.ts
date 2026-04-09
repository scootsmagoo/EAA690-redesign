import { NextRequest, NextResponse } from 'next/server'
import { parseContactPayload, sendContactEmail } from '@/lib/contact-email'

const MAX_BODY_BYTES = 32_768

export async function POST(request: NextRequest) {
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

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL_FROM?.trim()) {
    console.error('Contact form: missing RESEND_API_KEY or CONTACT_EMAIL_FROM')
    return NextResponse.json(
      { error: 'Contact form is not configured. Please email info@eaa690.org directly.' },
      { status: 503 }
    )
  }

  try {
    await sendContactEmail(parsed.payload)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Contact email send failed:', err)
    return NextResponse.json(
      { error: 'Could not send your message. Please try again or email info@eaa690.org.' },
      { status: 500 }
    )
  }
}
