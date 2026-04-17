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
}

/** Notify chapter inbox after a successful DB insert (best-effort). */
export async function sendProgramFormNotificationEmail(
  formType: FormType,
  payload: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_EMAIL_FROM?.trim()
  const toRaw = process.env.CONTACT_EMAIL_TO?.trim() || 'info@eaa690.org'

  if (!apiKey || !from) {
    throw new Error('Email not configured')
  }

  const to = toRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (to.length === 0) throw new Error('CONTACT_EMAIL_TO is empty')

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
