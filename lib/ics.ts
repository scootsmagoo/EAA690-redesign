import type { Event } from '@/lib/sanity-types'

// ─── Helpers (RFC 5545) ──────────────────────────────────────────────────────

/** Convert "h:MM AM/PM" + "YYYY-MM-DD" to compact ICS form (YYYYMMDDTHHmmss). */
function toIcsDate(date: string, time?: string): string {
  if (!time) return date.replace(/-/g, '')
  const match = time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!match) return date.replace(/-/g, '')
  let hours = parseInt(match[1])
  const minutes = match[2]
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return `${date.replace(/-/g, '')}T${String(hours).padStart(2, '0')}${minutes}00`
}

/** Returns the day after `dateStr` in compact form (YYYYMMDD). Used for all-day DTEND. */
export function nextDayCompact(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function icsEscape(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/** Fold long content lines at 75 octets per RFC 5545 §3.1 */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = [line.slice(0, 75)]
  let i = 75
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n')
}

/** Returns a UTC DTSTAMP suitable for the current moment. */
export function nowDtStamp(): string {
  return (
    new Date().toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\./g, '').slice(0, 15) + 'Z'
  )
}

// ─── Builders ────────────────────────────────────────────────────────────────

export function eventToVEvent(event: Event, dtstamp: string): string {
  const allDay = !event.startTime
  const start = toIcsDate(event.date, event.startTime)
  const end = event.endTime
    ? toIcsDate(event.date, event.endTime)
    : allDay
      ? nextDayCompact(event.date)
      : start

  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${event._id}@eaa690.org`,
    `DTSTAMP:${dtstamp}`,
    allDay
      ? `DTSTART;VALUE=DATE:${start}`
      : `DTSTART;TZID=America/New_York:${start}`,
    allDay
      ? `DTEND;VALUE=DATE:${end}`
      : `DTEND;TZID=America/New_York:${end}`,
    `SUMMARY:${icsEscape(event.title)}`,
  ]

  if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`)
  if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`)
  if (event.isRecurring && event.recurringInfo) {
    lines.push(`COMMENT:Recurring — ${icsEscape(event.recurringInfo)}`)
  }

  lines.push('END:VEVENT')
  return lines.map(foldLine).join('\r\n')
}

interface VCalendarOptions {
  /** Calendar display name (X-WR-CALNAME). Optional — only set for subscription feeds. */
  name?: string
  /** Calendar description (X-WR-CALDESC). */
  description?: string
}

export function wrapVCalendar(vevents: string[], opts: VCalendarOptions = {}): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EAA Chapter 690//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  if (opts.name) lines.push(`X-WR-CALNAME:${icsEscape(opts.name)}`)
  if (opts.description) lines.push(`X-WR-CALDESC:${icsEscape(opts.description)}`)
  lines.push('X-WR-TIMEZONE:America/New_York')
  lines.push(...vevents)
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
