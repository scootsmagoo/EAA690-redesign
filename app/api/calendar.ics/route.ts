import { NextResponse } from 'next/server'
import { getAllEvents } from '@/lib/sanity'
import type { Event } from '@/lib/sanity-types'

// Always fetch fresh — calendar apps poll this URL on their own schedule
export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function nextDayCompact(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

/** Escape special characters per RFC 5545 */
function icsEscape(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/** Fold long lines at 75 octets per RFC 5545 §3.1 */
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

function eventToVEvent(event: Event, dtstamp: string): string {
  const allDay = !event.startTime
  const start  = toIcsDate(event.date, event.startTime)
  const end    = event.endTime
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

  if (event.description) {
    lines.push(`DESCRIPTION:${icsEscape(event.description)}`)
  }
  if (event.location) {
    lines.push(`LOCATION:${icsEscape(event.location)}`)
  }
  if (event.isRecurring && event.recurringInfo) {
    lines.push(`COMMENT:Recurring — ${icsEscape(event.recurringInfo)}`)
  }

  lines.push('END:VEVENT')
  return lines.map(foldLine).join('\r\n')
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const events: Event[] = await getAllEvents()
    const dtstamp = new Date().toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\./g, '').slice(0, 15) + 'Z'

    const vevents = events.map((e) => eventToVEvent(e, dtstamp)).join('\r\n')

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EAA Chapter 690//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:EAA Chapter 690 Events',
      'X-WR-CALDESC:Events from EAA Chapter 690 at Briscoe Field (KLZU)\\, Lawrenceville GA',
      'X-WR-TIMEZONE:America/New_York',
      vevents,
      'END:VCALENDAR',
    ].join('\r\n')

    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="eaa690-events.ics"',
        // Allow calendar apps to cache for up to 1 hour between polls
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('ICS feed error:', err)
    return new NextResponse('Failed to generate calendar feed', { status: 500 })
  }
}
