import { Resend } from 'resend'
import { escapeHtml, stripCtl } from './password-reset-email'

interface VerificationEmailArgs {
  to: string
  name?: string | null
  verifyUrl: string
}

/**
 * Send a "confirm your email" message via Resend. Called from Better Auth's
 * `emailVerification.sendVerificationEmail`. Confirming proves the person owns
 * the address, which is what lets a roster match approve the account
 * automatically (see lib/roster-auto-approval.ts).
 *
 * Same sender precedence as the password-reset email: AUTH_EMAIL_FROM, then
 * CONTACT_EMAIL_FROM.
 */
export async function sendVerificationEmail({ to, name, verifyUrl }: VerificationEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.AUTH_EMAIL_FROM?.trim() || process.env.CONTACT_EMAIL_FROM?.trim()
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
  if (!from) throw new Error('No transactional sender configured. Set AUTH_EMAIL_FROM or CONTACT_EMAIL_FROM.')

  const safeName = name ? stripCtl(name, 120) : ''
  const greeting = safeName ? `Hi ${safeName},` : 'Hello,'
  const subject = 'Confirm your email for the EAA 690 website'

  const text = [
    greeting,
    '',
    'Thanks for creating an account on the EAA Chapter 690 website.',
    'Please confirm your email address by opening the link below within the next 24 hours:',
    '',
    verifyUrl,
    '',
    "If this address is on the chapter's membership roster, member access turns on as soon",
    "as you confirm. Otherwise a chapter admin will review your request.",
    '',
    "If you didn't create an account, you can ignore this email.",
    '',
    '— EAA Chapter 690',
  ].join('\n')

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #003366; margin-bottom: 16px;">Confirm your email</h2>
    <p style="font-size: 15px; line-height: 1.5;">${escapeHtml(greeting)}</p>
    <p style="font-size: 15px; line-height: 1.5;">
      Thanks for creating an account on the <strong>EAA Chapter 690</strong> website.
      Please confirm your email address within the next 24 hours:
    </p>
    <p style="margin: 28px 0;">
      <a href="${escapeHtml(verifyUrl)}"
         style="display: inline-block; background: #003366; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Confirm my email
      </a>
    </p>
    <p style="font-size: 15px; line-height: 1.5;">
      If this address is on the chapter's membership roster, member access turns on as soon as you
      confirm. Otherwise a chapter admin will review your request.
    </p>
    <p style="font-size: 13px; color: #4b5563; line-height: 1.5;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${escapeHtml(verifyUrl)}" style="color: #0066cc; word-break: break-all;">${escapeHtml(verifyUrl)}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;">
    <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
      If you didn't create an account, you can ignore this email.
    </p>
    <p style="font-size: 13px; color: #6b7280;">&mdash; EAA Chapter 690</p>
  </div>
  `.trim()

  const { error } = await new Resend(apiKey).emails.send({ from, to, subject, text, html })
  if (error) {
    console.error('Verification email failed:', error)
    throw new Error(error.message || 'Failed to send verification email')
  }
}
