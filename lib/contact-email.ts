import { Resend } from 'resend'

const SUBJECT_KEYS = [
  'general',
  'membership',
  'programs',
  'events',
  'donation',
  'other',
] as const

export type ContactSubjectKey = (typeof SUBJECT_KEYS)[number]

const SUBJECT_LABELS: Record<ContactSubjectKey, string> = {
  general: 'General Inquiry',
  membership: 'Membership',
  programs: 'Programs',
  events: 'Events',
  donation: 'Donation',
  other: 'Other',
}

export type ContactPayload = {
  name: string
  email: string
  phone: string
  subject: ContactSubjectKey
  message: string
}

const MAX_NAME = 200
const MAX_EMAIL = 320
const MAX_PHONE = 40
const MAX_MESSAGE = 12_000

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function parseContactPayload(
  data: Record<string, unknown>
): { ok: true; payload: ContactPayload } | { ok: false; error: string } {
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const email = typeof data.email === 'string' ? data.email.trim() : ''
  const phone = typeof data.phone === 'string' ? data.phone.trim() : ''
  const subject = data.subject
  const message = typeof data.message === 'string' ? data.message.trim() : ''

  if (!isNonEmptyString(name) || name.length > MAX_NAME) {
    return { ok: false, error: 'Invalid name' }
  }
  if (!isNonEmptyString(email) || email.length > MAX_EMAIL) {
    return { ok: false, error: 'Invalid email' }
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailOk) {
    return { ok: false, error: 'Invalid email' }
  }
  if (phone.length > MAX_PHONE) {
    return { ok: false, error: 'Invalid phone' }
  }
  if (!SUBJECT_KEYS.includes(subject as ContactSubjectKey)) {
    return { ok: false, error: 'Invalid subject' }
  }
  if (!isNonEmptyString(message) || message.length > MAX_MESSAGE) {
    return { ok: false, error: 'Invalid message' }
  }

  return {
    ok: true,
    payload: {
      name,
      email,
      phone,
      subject: subject as ContactSubjectKey,
      message,
    },
  }
}

export function getContactSubjectLabel(key: ContactSubjectKey): string {
  return SUBJECT_LABELS[key]
}

export async function sendContactEmail(payload: ContactPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_EMAIL_FROM?.trim()
  const toRaw = process.env.CONTACT_EMAIL_TO?.trim() || 'info@eaa690.org'

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!from) {
    throw new Error('CONTACT_EMAIL_FROM is not configured')
  }

  const to = toRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (to.length === 0) {
    throw new Error('CONTACT_EMAIL_TO is empty')
  }

  const label = SUBJECT_LABELS[payload.subject]
  const mailSubject = `[EAA 690 Website] ${label} — ${payload.name}`

  const text = [
    `New message from the EAA 690 contact form.`,
    ``,
    `Subject category: ${label}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.phone ? `Phone: ${payload.phone}` : 'Phone: (not provided)',
    ``,
    `Message:`,
    payload.message,
    ``,
    `---`,
    `Reply directly to this email to reach ${payload.name} (${payload.email}).`,
  ].join('\n')

  const html = `
  <p><strong>New message</strong> from the EAA 690 contact form.</p>
  <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
    <tr><td style="padding:4px 12px 4px 0;vertical-align:top;"><strong>Category</strong></td><td>${escapeHtml(label)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;vertical-align:top;"><strong>Name</strong></td><td>${escapeHtml(payload.name)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;vertical-align:top;"><strong>Email</strong></td><td><a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></td></tr>
    <tr><td style="padding:4px 12px 4px 0;vertical-align:top;"><strong>Phone</strong></td><td>${payload.phone ? escapeHtml(payload.phone) : '(not provided)'}</td></tr>
  </table>
  <p style="margin-top:16px;"><strong>Message</strong></p>
  <pre style="white-space:pre-wrap;font-family:inherit;background:#f6f8fa;padding:12px;border-radius:8px;">${escapeHtml(payload.message)}</pre>
  <p style="color:#555;font-size:13px;">Reply to this email to reach the sender.</p>
  `.trim()

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: payload.email,
    subject: mailSubject,
    text,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error(error.message || 'Failed to send email')
  }
}
