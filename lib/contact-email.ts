import { Resend } from 'resend'
import {
  CONTACT_SUBJECT_KEYS,
  getContactSubjectLabel,
  type ContactSubjectKey,
} from './contact-categories'

export type { ContactSubjectKey } from './contact-categories'
export { getContactSubjectLabel } from './contact-categories'

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

/**
 * Strip ASCII control characters (incl. CR/LF/NUL) from values that flow into
 * email headers (Subject, From, Reply-To). Defense-in-depth against header
 * injection (RFC 5322 §2.2 — header fields cannot contain CR/LF). Resend's SDK
 * is expected to sanitize, but enforcing it here makes the contract explicit
 * and protects us if we swap providers later.
 */
function stripCtl(s: string, max = 200): string {
  return s.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
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
  if (!CONTACT_SUBJECT_KEYS.includes(subject as ContactSubjectKey)) {
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

export type ContactEmailSendOptions = {
  /** When set, sends to these addresses instead of splitting `CONTACT_EMAIL_TO`. */
  to?: string[]
}

export async function sendContactEmail(
  payload: ContactPayload,
  options?: ContactEmailSendOptions
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_EMAIL_FROM?.trim()
  const toRaw = process.env.CONTACT_EMAIL_TO?.trim() || 'info@eaa690.org'

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!from) {
    throw new Error('CONTACT_EMAIL_FROM is not configured')
  }

  const to =
    options?.to && options.to.length > 0
      ? options.to
      : toRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
  if (to.length === 0) {
    throw new Error('CONTACT_EMAIL_TO is empty')
  }

  const label = getContactSubjectLabel(payload.subject)
  // Header-injection hardening: name is interpolated into the Subject header.
  // We also normalize the email used as Reply-To so an attacker can't smuggle
  // newlines through it even if a malformed value somehow bypassed validation.
  const safeName = stripCtl(payload.name, 120)
  const safeReplyTo = stripCtl(payload.email, 320)
  const mailSubject = `[EAA 690 Website] ${label} — ${safeName}`

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
    replyTo: safeReplyTo,
    subject: mailSubject,
    text,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error(error.message || 'Failed to send email')
  }
}
