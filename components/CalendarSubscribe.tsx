interface CalendarSubscribeProps {
  googleSubscribeUrl: string
  webcalUrl: string
  outlookSubscribeUrl: string
  /** Shown under the heading when using Google as source of truth. */
  sourceNote?: string
}

export default function CalendarSubscribe({
  googleSubscribeUrl,
  webcalUrl,
  outlookSubscribeUrl,
  sourceNote,
}: CalendarSubscribeProps) {
  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <h2 className="text-base font-bold text-eaa-blue mb-1">Subscribe to chapter events</h2>
        <p className="text-sm text-gray-500">
          Add the chapter calendar to your phone or computer. Events update automatically when editors
          change them in Google Calendar.
        </p>
        {sourceNote && <p className="text-xs text-gray-400 mt-2">{sourceNote}</p>}
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
        <a
          href={googleSubscribeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <GoogleIcon />
          Google Calendar
        </a>
        <a
          href={webcalUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title="Opens Apple Calendar on Mac or iPhone and prompts you to subscribe"
        >
          <AppleIcon />
          Apple Calendar
        </a>
        <a
          href={outlookSubscribeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title="Subscribe in Outlook.com"
        >
          <OutlookIcon />
          Outlook
        </a>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect width="24" height="24" rx="5" fill="#FF3B30" />
      <rect x="2" y="6" width="20" height="16" rx="3" fill="white" />
      <rect x="2" y="6" width="20" height="5" fill="#FF3B30" />
      <rect x="7" y="2" width="2" height="5" rx="1" fill="#FF3B30" />
      <rect x="15" y="2" width="2" height="5" rx="1" fill="#FF3B30" />
    </svg>
  )
}

function OutlookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 7.387v11.24c0 .958-.774 1.735-1.73 1.735H7.73C6.773 20.362 6 19.585 6 18.627V16.5l6.729-2.318L24 7.387z" fill="#0078D4" />
      <path d="M24 7.387L12.729 14.182 6 16.5V7.373c0-.957.773-1.734 1.73-1.734h14.54c.956 0 1.73.777 1.73 1.748z" fill="#0078D4" />
      <path d="M6 7.373v9.127L1.73 20.362C.773 20.362 0 19.585 0 18.627V5.373C0 4.416.773 3.64 1.73 3.64L6 7.373z" fill="#28A8E8" />
      <path d="M6 5.639V7.373L0 5.373V3.64c0-.957.773-1.734 1.73-1.734L6 5.639z" fill="#0078D4" />
      <path d="M12.729 9.5L6 5.639v1.734l6.729 3.861L24 5.387V3.747L12.729 9.5z" fill="#28A8E8" />
    </svg>
  )
}
