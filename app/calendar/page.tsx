import { getAllEvents } from '@/lib/sanity'
import type { Event } from '@/lib/sanity-types'
import EventCalendar from '@/components/EventCalendar'

// Always server-render so Sanity events appear immediately after publishing —
// without this Next.js bakes the page as static HTML at build time.
export const dynamic = 'force-dynamic'

const fallbackEvents: Event[] = [
  {
    _id: 'fallback-1',
    date: '2026-04-05',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    title: '1st Saturday Pancake Breakfast',
    description: 'Breakfast served 8:00 to 10:00 AM, Program at 10:00 AM. Alex Ortlano — "Dust Off" presentation.',
    location: 'Briscoe Field (KLZU)',
    eventType: 'breakfast',
    isRecurring: true,
    recurringInfo: '1st Saturday of each month',
  },
  {
    _id: 'fallback-2',
    date: '2026-05-03',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    title: '1st Saturday Pancake Breakfast',
    description: 'Monthly pancake breakfast and aviation program.',
    location: 'Briscoe Field (KLZU)',
    eventType: 'breakfast',
    isRecurring: true,
    recurringInfo: '1st Saturday of each month',
  },
  {
    _id: 'fallback-3',
    date: '2026-06-07',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    title: '1st Saturday Pancake Breakfast',
    description: 'Monthly pancake breakfast and aviation program.',
    location: 'Briscoe Field (KLZU)',
    eventType: 'breakfast',
    isRecurring: true,
    recurringInfo: '1st Saturday of each month',
  },
  {
    _id: 'fallback-4',
    date: '2026-05-17',
    startTime: '9:00 AM',
    endTime: '2:00 PM',
    title: 'Young Eagles Rally',
    description: 'Free airplane rides for young people ages 8–17. Volunteers and pilots welcome!',
    location: 'Briscoe Field (KLZU)',
    eventType: 'young-eagles',
  },
  {
    _id: 'fallback-5',
    date: '2026-06-20',
    startTime: '9:00 AM',
    title: 'Chapter Fly-Out',
    description: 'Group fly-out to a local destination. Details TBD — check the newsletter.',
    location: 'Briscoe Field (KLZU)',
    eventType: 'flyout',
  },
]

export default async function CalendarPage() {
  let events: Event[] = fallbackEvents

  try {
    const sanityEvents = await getAllEvents()
    if (sanityEvents && sanityEvents.length > 0) {
      events = sanityEvents
    }
  } catch {
    console.log('Using fallback events (Sanity not configured or unreachable)')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-eaa-blue">Calendar</h1>
          <p className="text-gray-500 mt-2">
            Click any event for details. Use Month or List view to browse.
          </p>
        </div>
        <a
          href="https://sanity.io/manage"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-eaa-light-blue hover:text-eaa-blue transition-colors font-medium"
          title="Manage events in Sanity Studio"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Manage Events
        </a>
      </div>

      <EventCalendar events={events} />

      {/* Subscribe to calendar feed */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-base font-bold text-eaa-blue mb-1">Subscribe to this Calendar</h2>
          <p className="text-sm text-gray-500">
            Add all EAA 690 events to Google Calendar, Apple Calendar, or Outlook — they&apos;ll update automatically as new events are published.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
          <a
            href="https://calendar.google.com/calendar/r?cid=webcal://eaa-960-redesign.vercel.app/api/calendar.ics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google Calendar
          </a>
          <a
            href="/api/calendar.ics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Apple / Outlook (.ics)
          </a>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h2 className="text-lg font-bold text-eaa-blue mb-3">Regular Events</h2>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li>
            <span className="font-semibold">1st Saturday of each month —</span>{' '}
            Pancake Breakfast (8–10 AM) &amp; Aviation Program (10 AM), Briscoe Field
          </li>
          <li>
            <span className="font-semibold">Monthly meetings —</span>{' '}
            Check our newsletter for current dates and times
          </li>
          <li>
            <span className="font-semibold">Young Eagles rallies —</span>{' '}
            Free flights for ages 8–17, scheduled throughout the year
          </li>
          <li>
            <span className="font-semibold">Fly-outs —</span>{' '}
            Group flights to local destinations, announced in the newsletter
          </li>
        </ul>
      </div>
    </div>
  )
}
