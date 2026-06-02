import { getAllEvents } from '@/lib/sanity'
import { getSiteBaseURL } from '@/lib/site-url'
import type { Event } from '@/lib/sanity-types'
import EventCalendar from '@/components/EventCalendar'
import GoogleCalendarEmbed from '@/components/GoogleCalendarEmbed'
import CalendarSubscribe from '@/components/CalendarSubscribe'
import {
  buildGoogleCalendarEmbedUrl,
  buildGoogleCalendarIcsUrl,
  buildGoogleCalendarSubscribeUrl,
  buildOutlookSubscribeUrl,
  buildWebcalUrl,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

const REGULAR_EVENTS = (
  <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6">
    <h2 className="text-lg font-bold text-eaa-blue mb-3">Regular Events</h2>
    <ul className="space-y-2 text-gray-700 text-sm">
      <li>
        <span className="font-semibold">1st Saturday of each month —</span> Pancake Breakfast (8–10 AM)
        &amp; Aviation Program (10 AM), Briscoe Field
      </li>
      <li>
        <span className="font-semibold">Monthly meetings —</span> Check our newsletter for current dates
        and times
      </li>
      <li>
        <span className="font-semibold">Young Eagles rallies —</span> Free flights for ages 8–17,
        scheduled throughout the year
      </li>
      <li>
        <span className="font-semibold">Fly-outs —</span> Group flights to local destinations, announced
        in the newsletter
      </li>
    </ul>
  </div>
)

/** Legacy Sanity + demo path when Google Calendar is not configured (local preview only). */
async function LegacySanityCalendar() {
  const fallbackEvents: Event[] = [
    {
      _id: 'fallback-1',
      date: '2026-04-05',
      startTime: '8:00 AM',
      endTime: '10:00 AM',
      title: '1st Saturday Pancake Breakfast',
      description:
        'Breakfast served 8:00 to 10:00 AM, Program at 10:00 AM. Alex Ortlano — "Dust Off" presentation.',
      location: 'Briscoe Field (KLZU)',
      eventType: 'breakfast',
      isRecurring: true,
      recurringInfo: '1st Saturday of each month',
    },
  ]

  let events: Event[] = fallbackEvents
  try {
    const sanityEvents = await getAllEvents()
    if (sanityEvents?.length) events = sanityEvents
  } catch {
    console.log('Using fallback events (Sanity not configured or unreachable)')
  }

  const baseUrl = getSiteBaseURL().replace(/\/$/, '')
  const feedHttpsUrl = `${baseUrl}/api/calendar.ics`
  const webcalUrl = buildWebcalUrl(feedHttpsUrl)
  const googleSubscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`
  const outlookSubscribeUrl = buildOutlookSubscribeUrl(feedHttpsUrl)

  return (
    <>
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Preview mode:</strong> This site is not yet connected to the chapter Google Calendar.
        Events shown here come from the CMS or sample data. To go live, set{' '}
        <code className="text-xs bg-white/70 px-1 rounded">NEXT_PUBLIC_GOOGLE_CALENDAR_ID</code> (see
        Admin → Chapter calendar).
      </div>
      <EventCalendar events={events} />
      <CalendarSubscribe
        googleSubscribeUrl={googleSubscribeUrl}
        webcalUrl={webcalUrl}
        outlookSubscribeUrl={outlookSubscribeUrl}
        sourceNote="Subscription feed is generated from this website until Google Calendar is connected."
      />
      {REGULAR_EVENTS}
    </>
  )
}

function GoogleCalendarSection() {
  const embedUrl = buildGoogleCalendarEmbedUrl()
  const icsUrl = buildGoogleCalendarIcsUrl()
  const webcalUrl = buildWebcalUrl(icsUrl)
  const googleSubscribeUrl = buildGoogleCalendarSubscribeUrl()
  const outlookSubscribeUrl = buildOutlookSubscribeUrl(icsUrl)

  return (
    <>
      <GoogleCalendarEmbed embedUrl={embedUrl} />
      <CalendarSubscribe
        googleSubscribeUrl={googleSubscribeUrl}
        webcalUrl={webcalUrl}
        outlookSubscribeUrl={outlookSubscribeUrl}
        sourceNote="Events are maintained in Google Calendar by chapter editors only."
      />
      {REGULAR_EVENTS}
    </>
  )
}

export default async function CalendarPage() {
  const useGoogle = isGoogleCalendarConfigured()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-eaa-blue">Calendar</h1>
        <p className="text-gray-500 mt-2">
          {useGoogle
            ? 'Chapter events from our shared Google Calendar. This page is read-only — to add or change events, use Google Calendar with an editor account.'
            : 'Select any event for details. Use Month or List view to browse.'}
        </p>
      </div>

      {useGoogle ? <GoogleCalendarSection /> : <LegacySanityCalendar />}
    </div>
  )
}
