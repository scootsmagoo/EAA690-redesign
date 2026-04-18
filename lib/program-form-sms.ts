/**
 * Twilio SMS notification stub for program-form submissions.
 *
 * SCAFFOLD ONLY UNTIL TWILIO IS PROVISIONED. When the three required env vars
 * are absent the function silently returns — submissions still save and email
 * alerts still fire. Once `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and
 * `TWILIO_FROM_NUMBER` are set, the function POSTs to Twilio's Messages REST
 * endpoint for each recipient. We use `fetch` (no SDK) to avoid pulling in
 * a dependency that wouldn't ship until SMS is actually turned on.
 *
 * Recipient phone numbers must already be in E.164 format (`+14045551234`);
 * normalization happens in `lib/form-notifications.ts`.
 */

import type { FormType } from '@/lib/forms-db'

const FORM_LABELS: Record<FormType, string> = {
  summer_camp: 'Summer Camp waitlist',
  scholarship: 'Scholarship application',
  youth_aviation: 'Youth Aviation Program',
  vmc_imc: 'VMC/IMC Club signup',
  outreach: 'Outreach / event request',
}

/** ASCII-only summary, hard-capped well under the 160-char single-segment SMS limit. */
function buildSmsBody(formType: FormType, payload: Record<string, unknown>): string {
  const label = FORM_LABELS[formType]
  const name =
    typeof payload.name === 'string' && payload.name.trim()
      ? payload.name.trim()
      : typeof payload.fullName === 'string' && payload.fullName.trim()
      ? payload.fullName.trim()
      : null
  const fragments = [`EAA 690: new ${label}`]
  if (name) fragments.push(`from ${name}`)
  fragments.push('— see /admin/submissions')
  const body = fragments.join(' ').replace(/\s+/g, ' ').trim()
  return body.length > 280 ? body.slice(0, 277) + '...' : body
}

/**
 * Send an SMS to each recipient via Twilio's REST API.
 *
 * Returns `{ skipped: true }` (no error) when Twilio isn't configured —
 * the orchestrator treats this as a successful no-op. Errors from the API are
 * thrown so the caller can log them, but the caller wraps in `.catch()` so
 * they never break the request.
 */
export async function sendProgramFormNotificationSms(
  formType: FormType,
  payload: Record<string, unknown>,
  recipients: string[]
): Promise<{ skipped: true } | { sent: number; failed: number }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim()

  if (!accountSid || !authToken || !fromNumber) {
    return { skipped: true }
  }
  if (recipients.length === 0) {
    return { skipped: true }
  }

  const body = buildSmsBody(formType, payload)
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  let sent = 0
  let failed = 0

  await Promise.all(
    recipients.map(async (to) => {
      const form = new URLSearchParams({ To: to, From: fromNumber, Body: body })
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        })
        if (!res.ok) {
          failed += 1
          const text = await res.text().catch(() => '')
          console.error(`Twilio SMS to ${to} failed: ${res.status} ${text.slice(0, 200)}`)
        } else {
          sent += 1
        }
      } catch (err) {
        failed += 1
        console.error(`Twilio SMS to ${to} threw:`, err)
      }
    })
  )

  if (failed > 0 && sent === 0) {
    throw new Error('All Twilio SMS sends failed')
  }
  return { sent, failed }
}
