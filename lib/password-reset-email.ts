import { Resend } from 'resend'

interface ResetEmailArgs {
  to: string
  name?: string | null
  resetUrl: string
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
 * Strip ASCII control characters (incl. CR/LF/NUL) from a value before it lands in an email
 * body. Defense-in-depth: Resend sanitizes outbound mail, but we don't want a stray CRLF in a
 * user's display name to corrupt the plaintext layout or smuggle anything through if a future
 * provider swap is less strict (mirrors the contact-form helper in lib/contact-email.ts).
 */
function stripCtl(s: string, max = 200): string {
  return s.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

/**
 * Send a "reset your password" email via Resend. Called from Better Auth's
 * `emailAndPassword.sendResetPassword` callback. The reset URL already has
 * the one-time token baked in by Better Auth.
 *
 * Sender precedence: AUTH_EMAIL_FROM (transactional) → CONTACT_EMAIL_FROM
 * (shared shop-front inbox). Operators can configure the dedicated
 * AUTH_EMAIL_FROM when they want auth mail to come from noreply@ rather
 * than the chapter inbox; otherwise we reuse the existing sender so we
 * don't require additional env config to ship.
 */
export async function sendPasswordResetEmail({ to, name, resetUrl }: ResetEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.AUTH_EMAIL_FROM?.trim() ||
    process.env.CONTACT_EMAIL_FROM?.trim()

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!from) {
    throw new Error(
      'No transactional sender configured. Set AUTH_EMAIL_FROM or CONTACT_EMAIL_FROM.'
    )
  }

  const safeName = name ? stripCtl(name, 120) : ''
  const greeting = safeName ? `Hi ${safeName},` : 'Hello,'
  const subject = 'Reset your EAA 690 password'

  const text = [
    greeting,
    '',
    'Someone requested a password reset for your EAA Chapter 690 account.',
    'To set a new password, open the link below within the next hour:',
    '',
    resetUrl,
    '',
    "If you didn't request this, you can safely ignore this email — your password",
    "won't change unless you open the link above.",
    '',
    '— EAA Chapter 690',
  ].join('\n')

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #003366; margin-bottom: 16px;">Reset your password</h2>
    <p style="font-size: 15px; line-height: 1.5;">${escapeHtml(greeting)}</p>
    <p style="font-size: 15px; line-height: 1.5;">
      Someone requested a password reset for your <strong>EAA Chapter 690</strong> account.
      To set a new password, click the button below within the next hour:
    </p>
    <p style="margin: 28px 0;">
      <a href="${escapeHtml(resetUrl)}"
         style="display: inline-block; background: #003366; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Reset my password
      </a>
    </p>
    <p style="font-size: 13px; color: #4b5563; line-height: 1.5;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${escapeHtml(resetUrl)}" style="color: #0066cc; word-break: break-all;">${escapeHtml(resetUrl)}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;">
    <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
      If you didn't request this, you can safely ignore this email &mdash;
      your password won't change unless you open the link above.
    </p>
    <p style="font-size: 13px; color: #6b7280;">&mdash; EAA Chapter 690</p>
  </div>
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
    console.error('Password reset email failed:', error)
    throw new Error(error.message || 'Failed to send password reset email')
  }
}
