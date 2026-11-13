import { getSiteBaseURL } from '@/lib/site-url'
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

/**
 * Shown when NEXT_PUBLIC_GOOGLE_CALENDAR_ID is unset (local dev / previews).
 * Production always renders the Google Calendar embed.
 */
function CalendarNotConfigured() {
  const baseUrl = getSiteBaseURL().replace(/\/$/, '')
  const feedHttpsUrl = `${baseUrl}/api/calendar.ics`
  const webcalUrl = buildWebcalUrl(feedHttpsUrl)
  const googleSubscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`
  const outlookSubscribeUrl = buildOutlookSubscribeUrl(feedHttpsUrl)

  return (
    <>
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Calendar not connected:</strong> set{' '}
        <code className="text-xs bg-white/70 px-1 rounded-sm">NEXT_PUBLIC_GOOGLE_CALENDAR_ID</code> to show
        the chapter Google Calendar here (see Admin → Chapter calendar).
      </div>
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
          Chapter events from our shared Google Calendar. This page is read-only — to add or change
          events, use Google Calendar with an editor account.
        </p>
      </div>

      {useGoogle ? <GoogleCalendarSection /> : <CalendarNotConfigured />}
    </div>
  )
}
