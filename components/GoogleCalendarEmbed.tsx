'use client'

interface GoogleCalendarEmbedProps {
  embedUrl: string
  title?: string
}

/**
 * Read-only chapter calendar from Google. Event creation/editing happens only
 * in Google Calendar for accounts with editor access — not on this site.
 */
export default function GoogleCalendarEmbed({
  embedUrl,
  title = 'EAA Chapter 690 events calendar',
}: GoogleCalendarEmbedProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <iframe
        src={embedUrl}
        title={title}
        className="w-full border-0"
        style={{ minHeight: '600px', height: '70vh' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
