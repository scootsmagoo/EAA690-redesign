/**
 * Chapter calendar is sourced from a single Google Calendar.
 * Only people with edit access in Google can add or change events;
 * the public site embed and ICS feeds are read-only.
 */

const DEFAULT_TIMEZONE = 'America/New_York'

/** Public embed / ICS calendar ID (e.g. chapter690@group.calendar.google.com). */
export function getGoogleCalendarId(): string | null {
  const id =
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID?.trim() ||
    process.env.GOOGLE_CALENDAR_ID?.trim()
  return id || null
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(getGoogleCalendarId())
}

export function getGoogleCalendarTimezone(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_TIMEZONE?.trim() || DEFAULT_TIMEZONE
}

/** Google Calendar embed (month view, no public "create event" on our site). */
export function buildGoogleCalendarEmbedUrl(calendarId?: string): string {
  const id = calendarId ?? getGoogleCalendarId()
  if (!id) return ''
  const params = new URLSearchParams({
    src: id,
    ctz: getGoogleCalendarTimezone(),
    mode: 'MONTH',
    showTitle: '0',
    showNav: '1',
    showDate: '1',
    showPrint: '0',
    showTabs: '1',
    showCalendars: '0',
    showTz: '0',
  })
  return `https://calendar.google.com/calendar/embed?${params}`
}

/** Public ICS feed (calendar must be shared: "See all event details" in Google). */
export function buildGoogleCalendarIcsUrl(calendarId?: string): string {
  const id = calendarId ?? getGoogleCalendarId()
  if (!id) return ''
  return `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`
}

/** Open the calendar in Google Calendar (view; edit requires Google account with access). */
export function buildGoogleCalendarViewUrl(calendarId?: string): string {
  const id = calendarId ?? getGoogleCalendarId()
  if (!id) return 'https://calendar.google.com/calendar'
  return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(id)}`
}

/** Add-by-URL flow in Google Calendar (subscribe to chapter feed). */
export function buildGoogleCalendarSubscribeUrl(calendarId?: string): string {
  const ics = buildGoogleCalendarIcsUrl(calendarId)
  if (!ics) return 'https://calendar.google.com/calendar'
  return `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?url=${encodeURIComponent(ics)}`
}

export function buildWebcalUrl(httpsIcsUrl: string): string {
  return httpsIcsUrl.replace(/^https?:\/\//, 'webcal://')
}

export function buildOutlookSubscribeUrl(httpsIcsUrl: string, name = 'EAA 690 Events'): string {
  return `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(httpsIcsUrl)}&name=${encodeURIComponent(name)}`
}
