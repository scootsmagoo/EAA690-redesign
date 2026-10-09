/**
 * Types and helpers for siteSettings-driven UI (announcement bar, etc.).
 * Keep date comparisons in local calendar days to match Sanity `date` fields (YYYY-MM-DD).
 */

export type SiteAnnouncementFields = {
  enabled?: boolean
  message?: string
  linkUrl?: string
  linkText?: string
  style?: 'info' | 'warning' | 'neutral'
  startDate?: string
  endDate?: string
}

export type AnnouncementBarProps = {
  message: string
  linkUrl?: string
  linkText?: string
  variant: 'info' | 'warning' | 'neutral'
}

function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Whether the announcement should show on the public site right now. */
export function getAnnouncementBar(
  announcement: SiteAnnouncementFields | null | undefined,
  now: Date = new Date()
): AnnouncementBarProps | null {
  if (!announcement?.enabled) return null
  const message = announcement.message?.trim()
  if (!message) return null

  const today = localDateString(now)
  if (announcement.startDate && announcement.startDate > today) return null
  if (announcement.endDate && today > announcement.endDate) return null

  const style = announcement.style ?? 'info'
  const variant = style === 'warning' || style === 'neutral' ? style : 'info'

  const linkUrl = announcement.linkUrl?.trim()
  const linkText = announcement.linkText?.trim()

  return {
    message,
    variant,
    ...(linkUrl ? { linkUrl } : {}),
    ...(linkText ? { linkText } : {}),
  }
}

export const DEFAULT_MISSION_STATEMENT =
  'EAA Chapter 690 promotes aviation education, safety, and youth involvement in the Atlanta Metro area through hands-on aircraft building programs, Young Eagles flights, mentorship, and public outreach.'

/** Mission statement from Site Settings, or the chapter's default wording when blank. */
export function resolveMissionStatement(value: string | null | undefined): string {
  return value?.trim() || DEFAULT_MISSION_STATEMENT
}
