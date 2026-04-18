/**
 * Form-submission alert layer.
 *
 * Resolves recipients (Sanity siteSettings → env-var fallback) and dispatches
 * email + SMS notifications best-effort. Callers should never await this for
 * correctness — the user already got their 201 response. Failures here are
 * logged but never surfaced.
 *
 * Recipient precedence for a given program form type:
 *   1. siteSettings.formNotifications.perFormEmailRecipients[<formType>] (if non-empty)
 *   2. siteSettings.formNotifications.defaultEmailRecipients                (if non-empty)
 *   3. env CONTACT_EMAIL_TO (comma-separated)                               (if non-empty)
 *   4. fallback: 'info@eaa690.org'                                          (last resort)
 *
 * The master `formNotifications.enabled` toggle short-circuits everything.
 */

import { getSiteSettings } from '@/lib/sanity'
import type { FormType } from '@/lib/forms-db'
import { sendProgramFormNotificationEmail } from '@/lib/program-form-email'
import { sendProgramFormNotificationSms } from '@/lib/program-form-sms'

export type FormNotificationsConfig = {
  enabled: boolean
  defaultEmailRecipients: string[]
  perFormEmailRecipients: Record<FormType, string[]>
  smsRecipients: string[]
  adminUserCreatedAlerts: boolean
}

const FORM_TYPE_TO_SLOT_KEY: Record<FormType, keyof FormNotificationsConfig['perFormEmailRecipients']> = {
  summer_camp: 'summer_camp',
  scholarship: 'scholarship',
  youth_aviation: 'youth_aviation',
  vmc_imc: 'vmc_imc',
  outreach: 'outreach',
}

/**
 * Sanity stores per-form keys in camelCase to match the rest of the
 * `programForms` shape; the DB / route layer uses snake_case `FormType`.
 * Keep the mapping in one place so we never confuse them.
 */
const SANITY_KEY_BY_FORM_TYPE: Record<FormType, 'youthAviation' | 'scholarship' | 'summerCamp' | 'vmcImc' | 'outreach'> = {
  youth_aviation: 'youthAviation',
  scholarship: 'scholarship',
  summer_camp: 'summerCamp',
  vmc_imc: 'vmcImc',
  outreach: 'outreach',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const E164_RE = /^\+[1-9]\d{6,14}$/

/**
 * Defense-in-depth header sanitizer. RFC 5322 §2.2 forbids CR/LF in header
 * fields; the underlying SDK is expected to enforce this, but we strip any
 * ASCII control characters (and collapse remaining whitespace) before any
 * value is interpolated into Subject / From / Reply-To. Mirrors the helper
 * used by `lib/contact-email.ts` so we keep the same defense everywhere a
 * stored value flows into an email header.
 */
function stripCtl(s: string, max = 200): string {
  return s.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

function dedupe(list: string[]): string[] {
  return Array.from(new Set(list))
}

function normalizeEmailList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed) continue
    if (!EMAIL_RE.test(trimmed)) continue
    out.push(trimmed)
  }
  return dedupe(out).slice(0, 50)
}

function normalizePhoneList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim().replace(/\s|-/g, '')
    if (!trimmed) continue
    if (!E164_RE.test(trimmed)) continue
    out.push(trimmed)
  }
  return dedupe(out).slice(0, 25)
}

function envEmailRecipients(): string[] {
  const raw = process.env.CONTACT_EMAIL_TO?.trim() || 'info@eaa690.org'
  return dedupe(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => EMAIL_RE.test(s))
  )
}

const EMPTY_PER_FORM: Record<FormType, string[]> = {
  summer_camp: [],
  scholarship: [],
  youth_aviation: [],
  vmc_imc: [],
  outreach: [],
}

const DEFAULT_CONFIG: FormNotificationsConfig = {
  enabled: true,
  defaultEmailRecipients: [],
  perFormEmailRecipients: { ...EMPTY_PER_FORM },
  smsRecipients: [],
  adminUserCreatedAlerts: true,
}

/**
 * Coerces whatever Sanity returns into a strict, defensively-typed config.
 * Safe to call even when the formNotifications group has never been edited.
 */
export function normalizeFormNotificationsConfig(raw: unknown): FormNotificationsConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG, perFormEmailRecipients: { ...EMPTY_PER_FORM } }
  const o = raw as Record<string, unknown>

  const perRaw = (o.perFormEmailRecipients ?? {}) as Record<string, unknown>
  const perFormEmailRecipients: Record<FormType, string[]> = {
    summer_camp: normalizeEmailList(perRaw.summerCamp),
    scholarship: normalizeEmailList(perRaw.scholarship),
    youth_aviation: normalizeEmailList(perRaw.youthAviation),
    vmc_imc: normalizeEmailList(perRaw.vmcImc),
    outreach: normalizeEmailList(perRaw.outreach),
  }

  return {
    enabled: o.enabled !== false,
    defaultEmailRecipients: normalizeEmailList(o.defaultEmailRecipients),
    perFormEmailRecipients,
    smsRecipients: normalizePhoneList(o.smsRecipients),
    adminUserCreatedAlerts: o.adminUserCreatedAlerts !== false,
  }
}

export function resolveEmailRecipientsForForm(
  formType: FormType,
  config: FormNotificationsConfig
): string[] {
  const perForm = config.perFormEmailRecipients[FORM_TYPE_TO_SLOT_KEY[formType]] ?? []
  if (perForm.length > 0) return perForm
  if (config.defaultEmailRecipients.length > 0) return config.defaultEmailRecipients
  return envEmailRecipients()
}

export async function loadFormNotificationsConfig(): Promise<FormNotificationsConfig> {
  try {
    const settings = (await getSiteSettings()) as
      | { formNotifications?: unknown }
      | null
    return normalizeFormNotificationsConfig(settings?.formNotifications)
  } catch (err) {
    console.error('loadFormNotificationsConfig: falling back to defaults', err)
    return normalizeFormNotificationsConfig(undefined)
  }
}

/**
 * Best-effort: send all configured notifications for a program form submission.
 * Callers should NOT await this for correctness — wrap in a try/catch and
 * log only. Returns nothing useful; errors are logged inside.
 */
export async function notifyProgramFormSubmission(
  formType: FormType,
  payload: Record<string, unknown>
): Promise<void> {
  const config = await loadFormNotificationsConfig()
  if (!config.enabled) return

  const emailRecipients = resolveEmailRecipientsForForm(formType, config)

  await Promise.allSettled([
    emailRecipients.length > 0
      ? sendProgramFormNotificationEmail(formType, payload, emailRecipients).catch((err) => {
          console.error('Program form email notification failed:', err)
        })
      : Promise.resolve(),
    config.smsRecipients.length > 0
      ? sendProgramFormNotificationSms(formType, payload, config.smsRecipients).catch((err) => {
          console.error('Program form SMS notification failed:', err)
        })
      : Promise.resolve(),
  ])
}

/**
 * Security alert: an existing admin promoted another user to the admin role.
 * Reuses the same recipient list as form notifications, gated on its own toggle.
 */
export async function notifyAdminUserPromoted(args: {
  promotedUser: { id: string; email: string; name?: string | null }
  promotedBy: { id: string; email: string; name?: string | null }
}): Promise<void> {
  const config = await loadFormNotificationsConfig()
  if (!config.enabled || !config.adminUserCreatedAlerts) return

  const recipients = config.defaultEmailRecipients.length > 0
    ? config.defaultEmailRecipients
    : envEmailRecipients()
  if (recipients.length === 0) return

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.CONTACT_EMAIL_FROM?.trim()
  if (!apiKey || !from) {
    /**
     * Visibility guarantee: a security-event alert silently failing because
     * Resend isn't configured is itself a problem worth surfacing in logs.
     * Without this warning, admins would never know their promotion alerts
     * are no-ops on a misconfigured deploy.
     */
    console.warn(
      'notifyAdminUserPromoted: RESEND_API_KEY or CONTACT_EMAIL_FROM not set — admin promotion alert was NOT sent',
      { promotedUserId: args.promotedUser.id }
    )
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  /**
   * Stored values shouldn't be trusted blindly when interpolating into mail
   * headers. Email addresses can't legally contain CRLF, but defense-in-depth
   * is cheap.
   */
  const safeEmail = stripCtl(args.promotedUser.email, 320)
  const safeName = stripCtl(args.promotedUser.name ?? '(no name)', 200)
  const safeActorEmail = stripCtl(args.promotedBy.email, 320)
  const safeActorName = stripCtl(args.promotedBy.name ?? '(no name)', 200)

  const subject = `[EAA 690 Website] New admin: ${safeEmail}`
  const lines = [
    'A user has been granted ADMIN access on the EAA 690 website.',
    '',
    `Promoted user: ${safeName} <${safeEmail}>`,
    `Promoted user ID: ${args.promotedUser.id}`,
    '',
    `Promoted by: ${safeActorName} <${safeActorEmail}>`,
    `Promoted by ID: ${args.promotedBy.id}`,
    '',
    'If this was not expected, demote the account immediately at /admin/users.',
  ]

  try {
    const { error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      text: lines.join('\n'),
    })
    if (error) {
      console.error('notifyAdminUserPromoted Resend error:', error)
    }
  } catch (err) {
    console.error('notifyAdminUserPromoted send failed:', err)
  }
}
