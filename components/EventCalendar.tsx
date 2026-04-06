'use client'

import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import type { Event, EventType } from '@/lib/sanity-types'

// ─── Color map keyed by eventType ────────────────────────────────────────────
const EVENT_COLORS: Record<EventType | 'default', { bg: string; border: string }> = {
  breakfast:       { bg: '#003366', border: '#002244' },
  flyout:          { bg: '#0066CC', border: '#0055AA' },
  'young-eagles':  { bg: '#D97706', border: '#B45309' },
  meeting:         { bg: '#475569', border: '#334155' },
  special:         { bg: '#7C3AED', border: '#6D28D9' },
  general:         { bg: '#003366', border: '#002244' },
  default:         { bg: '#003366', border: '#002244' },
}

const LEGEND_ITEMS: { label: string; type: EventType }[] = [
  { label: 'Pancake Breakfast', type: 'breakfast' },
  { label: 'Fly-Out',           type: 'flyout' },
  { label: 'Young Eagles',      type: 'young-eagles' },
  { label: 'Meeting',           type: 'meeting' },
  { label: 'Special Event',     type: 'special' },
]

// ─── Time / date helpers ──────────────────────────────────────────────────────
function toISODateTime(date: string, time?: string): string {
  if (!time) return date
  const match = time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!match) return date
  let hours = parseInt(match[1])
  const minutes = match[2]
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return `${date}T${String(hours).padStart(2, '0')}:${minutes}:00`
}

/** Compact datetime for Google Calendar / ICS: YYYYMMDDTHHmmss */
function toCompactDateTime(date: string, time?: string): string {
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

/** ISO datetime for Outlook: YYYY-MM-DDTHH:mm:ss */
function toOutlookDateTime(date: string, time?: string): string {
  if (!time) return date
  const match = time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!match) return date
  let hours = parseInt(match[1])
  const minutes = match[2]
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return `${date}T${String(hours).padStart(2, '0')}:${minutes}:00`
}

function nextDayCompact(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function formatDisplayDate(dateStr: string, startTime?: string, endTime?: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  if (startTime && endTime) return `${formatted} · ${startTime} – ${endTime}`
  if (startTime) return `${formatted} · ${startTime}`
  return formatted
}

// ─── "Add to calendar" URL builders ──────────────────────────────────────────
function buildGoogleCalUrl(event: Event): string {
  const allDay = !event.startTime
  const start  = toCompactDateTime(event.date, event.startTime)
  const end    = event.endTime
    ? toCompactDateTime(event.date, event.endTime)
    : allDay
    ? nextDayCompact(event.date)
    : start
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     event.title,
    dates:    `${start}/${end}`,
    details:  event.description ?? '',
    location: event.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

function buildOutlookUrl(event: Event): string {
  const start = toOutlookDateTime(event.date, event.startTime)
  const end   = event.endTime
    ? toOutlookDateTime(event.date, event.endTime)
    : start
  const params = new URLSearchParams({
    subject:  event.title,
    startdt:  start,
    enddt:    end,
    body:     event.description ?? '',
    location: event.location ?? '',
    path:     '/calendar/action/compose',
    rru:      'addevent',
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`
}

function downloadIcs(event: Event): void {
  const allDay = !event.startTime
  const start  = toCompactDateTime(event.date, event.startTime)
  const end    = event.endTime
    ? toCompactDateTime(event.date, event.endTime)
    : allDay
    ? nextDayCompact(event.date)
    : start
  const dtstamp = new Date().toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\./g, '').slice(0, 15) + 'Z'
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/\n/g, '\\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EAA Chapter 690//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event._id}@eaa690.org`,
    `DTSTAMP:${dtstamp}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART;TZID=America/New_York:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}`     : `DTEND;TZID=America/New_York:${end}`,
    `SUMMARY:${esc(event.title)}`,
    event.description ? `DESCRIPTION:${esc(event.description)}` : '',
    event.location    ? `LOCATION:${esc(event.location)}`       : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Event detail modal ───────────────────────────────────────────────────────
function EventDetail({ event, onClose }: { event: Event; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const colors = EVENT_COLORS[event.eventType ?? 'default']

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured header */}
        <div className="px-6 py-5" style={{ backgroundColor: colors.bg }}>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-white leading-snug">{event.title}</h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/70 hover:text-white transition-colors mt-0.5"
              aria-label="Close event detail"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white/80 text-sm mt-2">
            {formatDisplayDate(event.date, event.startTime, event.endTime)}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {event.location && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-eaa-blue mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700">{event.location}</span>
            </div>
          )}

          {event.description && (
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
          )}

          {event.isRecurring && event.recurringInfo && (
            <div className="flex items-center gap-2 text-sm text-eaa-light-blue">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Recurring: {event.recurringInfo}</span>
            </div>
          )}

          {/* Add to calendar */}
          <div className="pt-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Add to your calendar
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={buildGoogleCalUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {/* Google "G" colours */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Calendar
              </a>

              <a
                href={buildOutlookUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {/* Outlook icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 7.387v11.24c0 .958-.774 1.735-1.73 1.735H7.73C6.773 20.362 6 19.585 6 18.627V16.5l6.729-2.318L24 7.387z" fill="#0078D4"/>
                  <path d="M24 7.387L12.729 14.182 6 16.5V7.373c0-.957.773-1.734 1.73-1.734h14.54c.956 0 1.73.777 1.73 1.748z" fill="#0078D4"/>
                  <path d="M6 7.373v9.127L1.73 20.362C.773 20.362 0 19.585 0 18.627V5.373C0 4.416.773 3.64 1.73 3.64L6 7.373z" fill="#28A8E8"/>
                  <path d="M6 5.639V7.373L0 5.373V3.64c0-.957.773-1.734 1.73-1.734L6 5.639z" fill="#0078D4"/>
                  <path d="M6 7.373L0 5.373l6 2z" fill="#14447D"/>
                  <path d="M14.54 3.639H7.73C6.773 3.639 6 4.416 6 5.373v.266L12.729 9.5 24 3.747c-.09-.06-14.54-.108-9.46-.108z" fill="#50D9FF" opacity=".5"/>
                  <path d="M12.729 9.5L6 5.639v1.734l6.729 3.861L24 5.387V3.747L12.729 9.5z" fill="#28A8E8"/>
                </svg>
                Outlook
              </a>

              <button
                onClick={() => downloadIcs(event)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                .ics file
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-eaa-blue text-white font-semibold py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
type CalendarView = 'dayGridMonth' | 'listYear'

export default function EventCalendar({ events }: { events: Event[] }) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<CalendarView>('dayGridMonth')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const calendarRef = useRef<FullCalendar>(null)

  // On mobile default to list view — month grid cells are too narrow for event pills.
  // Also gates SSR to prevent hydration mismatch.
  useEffect(() => {
    if (window.innerWidth < 640) setView('listYear')
    setMounted(true)
  }, [])

  const calendarEvents: EventInput[] = events.map((event) => {
    const colors = EVENT_COLORS[event.eventType ?? 'default']
    const start = toISODateTime(event.date, event.startTime)
    const end   = event.endTime ? toISODateTime(event.date, event.endTime) : undefined
    return {
      id: event._id,
      title: event.title,
      start,
      end,
      allDay: !event.startTime,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      extendedProps: { event },
    }
  })

  const handleViewChange = (newView: CalendarView) => {
    setView(newView)
    calendarRef.current?.getApi().changeView(newView)
  }

  const handleEventClick = (info: EventClickArg) => {
    info.jsEvent.preventDefault()
    setSelectedEvent(info.event.extendedProps.event as Event)
  }

  return (
    <div>
      {/* View toggle + legend row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange('dayGridMonth')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              view === 'dayGridMonth'
                ? 'bg-eaa-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => handleViewChange('listYear')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              view === 'listYear'
                ? 'bg-eaa-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            List
          </button>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGEND_ITEMS.map(({ label, type }) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: EVENT_COLORS[type].bg }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="fc-eaa bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
        {mounted ? (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
            initialView={view}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
            listDayFormat={{ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }}
            listDaySideFormat={false}
            noEventsContent="No events found."
            eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          />
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-eaa-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  )
}
