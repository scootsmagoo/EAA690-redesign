'use client'

import AdminGuard from '@/components/AdminGuard'
import Link from 'next/link'
import {
  buildGoogleCalendarEmbedUrl,
  buildGoogleCalendarIcsUrl,
  getGoogleCalendarId,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar'

function CalendarAdminInner() {
  const configured = isGoogleCalendarConfigured()
  const calendarId = getGoogleCalendarId()
  const embedUrl = buildGoogleCalendarEmbedUrl()
  const icsUrl = buildGoogleCalendarIcsUrl()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-eaa-light-blue hover:text-eaa-blue font-medium">
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold text-eaa-blue mt-3">Chapter calendar</h1>
        <p className="text-gray-600 mt-2">
          Events are managed in Google Calendar. The public{' '}
          <Link href="/calendar" className="text-eaa-light-blue hover:underline">
            /calendar
          </Link>{' '}
          page is read-only — visitors cannot add or edit events on the website.
        </p>
      </div>

      <div
        className={`rounded-xl border p-5 mb-8 ${
          configured
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <p className="font-semibold text-gray-900">
          {configured ? 'Google Calendar is connected' : 'Google Calendar is not configured yet'}
        </p>
        {configured ? (
          <p className="text-sm text-gray-700 mt-2 break-all">
            Calendar ID: <code className="text-xs bg-white/80 px-1 py-0.5 rounded">{calendarId}</code>
          </p>
        ) : (
          <p className="text-sm text-gray-700 mt-2">
            Set <code className="text-xs bg-white/80 px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_CALENDAR_ID</code>{' '}
            in your environment (Vercel → Settings → Environment Variables), then redeploy.
          </p>
        )}
      </div>

      <section className="space-y-6 text-gray-700">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-eaa-blue mb-3">How to get the calendar ID</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Open{' '}
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eaa-light-blue hover:underline"
              >
                Google Calendar
              </a>{' '}
              with an account that can edit the chapter calendar.
            </li>
            <li>Settings → select the chapter calendar under &quot;Settings for my calendars&quot;.</li>
            <li>
              Under <strong>Integrate calendar</strong>, copy the <strong>Calendar ID</strong> (often ends in{' '}
              <code className="text-xs">@group.calendar.google.com</code>).
            </li>
            <li>
              Ensure the calendar is shared publicly: <strong>Access permissions for events</strong> →{' '}
              <em>See all event details</em> (required for the website embed and subscribe links).
            </li>
            <li>
              Paste the ID into <code className="text-xs">NEXT_PUBLIC_GOOGLE_CALENDAR_ID</code> and redeploy.
            </li>
          </ol>
          <p className="text-sm text-gray-500 mt-4">
            The legacy site at{' '}
            <a
              href="https://www.eaa690.org/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-eaa-light-blue hover:underline"
            >
              eaa690.org/calendar
            </a>{' '}
            uses Squarespace Events; it does not expose a Google Calendar ID in the page HTML. Ask whoever
            maintains the chapter calendar for the Google Calendar ID, or migrate Squarespace events into
            Google and use that calendar going forward.
          </p>
        </div>

        {configured && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-3">Quick links</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-eaa-light-blue hover:underline font-medium"
                >
                  Open embed preview (Google)
                </a>
              </li>
              <li>
                <a href={icsUrl} className="text-eaa-light-blue hover:underline font-medium break-all">
                  Public ICS feed
                </a>
              </li>
              <li>
                <Link href="/calendar" className="text-eaa-light-blue hover:underline font-medium">
                  Public calendar page
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-sm">
          <p className="font-semibold text-eaa-blue mb-2">Sanity CMS events</p>
          <p>
            When Google Calendar is configured, the public calendar no longer loads events from Sanity.
            You can still use Sanity for news and other content; remove or stop publishing{' '}
            <em>event</em> documents in Sanity to avoid confusion.
          </p>
        </div>
      </section>
    </div>
  )
}

export default function AdminCalendarPage() {
  return (
    <AdminGuard>
      <CalendarAdminInner />
    </AdminGuard>
  )
}
