import { getAllEvents } from '@/lib/sanity'
import type { Event } from '@/lib/sanity-types'
import EventCalendar from '@/components/EventCalendar'

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

      <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl p-6">
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
