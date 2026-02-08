import { getUpcomingEvents } from '@/lib/sanity'
import type { Event } from '@/lib/sanity-types'

// Fallback data when Sanity isn't configured or has no events
const fallbackEvents = [
  {
    _id: 'fallback-1',
    date: '2026-02-07',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    title: '1st Saturday Pancake Breakfast',
    description: 'Breakfast served 8:00 to 10:00 AM, Program at 10:00 AM',
    location: 'Briscoe Field (KLZU)',
  },
  {
    _id: 'fallback-2',
    date: '2026-03-07',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    title: '1st Saturday Pancake Breakfast',
    description: 'Monthly pancake breakfast and aviation program',
    location: 'Briscoe Field (KLZU)',
  },
  {
    _id: 'fallback-3',
    date: '2026-04-04',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    title: '1st Saturday Pancake Breakfast',
    description: 'Monthly pancake breakfast and aviation program',
    location: 'Briscoe Field (KLZU)',
  },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function CalendarPage() {
  // Try to fetch from Sanity, fall back to hardcoded data
  let events: Event[] = fallbackEvents
  
  try {
    const sanityEvents = await getUpcomingEvents()
    if (sanityEvents && sanityEvents.length > 0) {
      events = sanityEvents
    }
  } catch (error) {
    // Sanity not configured or error - use fallback
    console.log('Using fallback events (Sanity not configured)')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Calendar</h1>

      <div className="space-y-6">
        {events.map((event) => (
          <div key={event._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-eaa-yellow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h2 className="text-2xl font-bold text-eaa-blue">{event.title}</h2>
              <div className="text-gray-600 mt-2 md:mt-0">
                <p className="font-semibold">{formatDate(event.date)}</p>
                {event.startTime && event.endTime && (
                  <p>{event.startTime} - {event.endTime}</p>
                )}
              </div>
            </div>
            {event.description && (
              <p className="text-gray-700 mb-2">{event.description}</p>
            )}
            <p className="text-gray-600">
              <strong>Location:</strong> {event.location}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-eaa-blue mb-4">Regular Events</h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            <strong>1st Saturday of each month:</strong> Pancake Breakfast and Aviation Program
          </li>
          <li>
            <strong>Monthly meetings:</strong> Check our newsletter for dates and times
          </li>
          <li>
            <strong>Fly-outs:</strong> Regularly scheduled throughout the year
          </li>
        </ul>
      </div>
    </div>
  )
}
