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
            href="webcal://eaa-960-redesign.vercel.app/api/calendar.ics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            title="Opens Apple Calendar on Mac or iPhone and prompts you to subscribe"
          >
            {/* Apple Calendar icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <rect width="24" height="24" rx="5" fill="#FF3B30"/>
              <rect x="2" y="6" width="20" height="16" rx="3" fill="white"/>
              <rect x="2" y="6" width="20" height="5" fill="#FF3B30"/>
              <rect x="7" y="2" width="2" height="5" rx="1" fill="#FF3B30"/>
              <rect x="15" y="2" width="2" height="5" rx="1" fill="#FF3B30"/>
            </svg>
            Apple Calendar
          </a>
          <a
            href="https://outlook.live.com/calendar/0/addfromweb?url=https://eaa-960-redesign.vercel.app/api/calendar.ics&name=EAA+690+Events"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            title="Subscribe in Outlook.com — events update automatically"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M24 7.387v11.24c0 .958-.774 1.735-1.73 1.735H7.73C6.773 20.362 6 19.585 6 18.627V16.5l6.729-2.318L24 7.387z" fill="#0078D4"/>
              <path d="M24 7.387L12.729 14.182 6 16.5V7.373c0-.957.773-1.734 1.73-1.734h14.54c.956 0 1.73.777 1.73 1.748z" fill="#0078D4"/>
              <path d="M6 7.373v9.127L1.73 20.362C.773 20.362 0 19.585 0 18.627V5.373C0 4.416.773 3.64 1.73 3.64L6 7.373z" fill="#28A8E8"/>
              <path d="M6 5.639V7.373L0 5.373V3.64c0-.957.773-1.734 1.73-1.734L6 5.639z" fill="#0078D4"/>
              <path d="M12.729 9.5L6 5.639v1.734l6.729 3.861L24 5.387V3.747L12.729 9.5z" fill="#28A8E8"/>
            </svg>
            Outlook
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
