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

// ─── Time helpers ─────────────────────────────────────────────────────────────
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

// ─── Event detail modal ───────────────────────────────────────────────────────
function EventDetail({ event, onClose }: { event: Event; onClose: () => void }) {
  // Close on Escape
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
        {/* Header bar uses event type color */}
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
