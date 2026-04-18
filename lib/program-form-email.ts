import { Resend } from 'resend'
import type { FormType } from '@/lib/forms-db'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const FORM_LABELS: Record<FormType, string> = {
  summer_camp: 'Summer Camp waitlist',
  scholarship: 'Scholarship application',
  youth_aviation: 'Youth Aviation Program',
  vmc_imc: 'VMC/IMC Club signup',
  outreach: 'Outreach / event request (Heidi)',
}

/**
 * Notify configured recipients after a successful DB insert (best-effort).
 *
 * `recipients` is the resolved list returned by `resolveEmailRecipientsForForm()`
 * — the caller (form-notifications.ts) handles per-form Sanity overrides and the
 * env-var fallback so this transport stays focused on rendering + sending.
 *
 * For backwards compatibility, if `recipients` is omitted we still derive the
 * list from the CONTACT_EMAIL_TO env var the same way the old implementation did.
 */
export async function sendProgramFormNotificationEmail(
  formType: FormType,
  payload: Record<string, unknown>,
  recipients?: string[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_EMAIL_FROM?.trim()

  if (!apiKey || !from) {
    throw new Error('Email not configured')
  }

  let to: string[]
  if (recipients && recipients.length > 0) {
    to = recipients
  } else {
    const toRaw = process.env.CONTACT_EMAIL_TO?.trim() || 'info@eaa690.org'
    to = toRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (to.length === 0) throw new Error('No recipients configured for form notifications')

  const label = FORM_LABELS[formType]
  const subject = `[EAA 690 Website] ${label}`

  const lines: string[] = [`Form: ${label}`, '']
  for (const [k, v] of Object.entries(payload)) {
    if (v === null || v === undefined) continue
    const s = typeof v === 'string' ? v : JSON.stringify(v)
    lines.push(`${k}: ${s}`)
  }
  const text = lines.join('\n')

  const rows = Object.entries(payload)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;"><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(String(v ?? ''))}</td></tr>`
    )
    .join('')
  const html = `
  <p><strong>${escapeHtml(label)}</strong> — new submission from the website.</p>
  <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">${rows}</table>
  `.trim()

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html,
  })

  if (error) {
    console.error('Resend program form error:', error)
    throw new Error(error.message || 'Failed to send email')
  }
}
