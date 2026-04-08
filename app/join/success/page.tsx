import Link from 'next/link'

export default function JoinSuccessPage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" focusable="false">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-eaa-blue mb-3">Welcome to EAA Chapter 690!</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your membership payment was successful. A receipt has been sent to your email.
          We look forward to seeing you at the hangar!
        </p>
        <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left space-y-2 text-sm text-gray-700">
          <p className="font-semibold text-eaa-blue">What&apos;s next?</p>
          <p>Join us at our monthly pancake breakfast — first Saturday of every month, 8–10 AM at Briscoe Field.</p>
          <p>
            Check the{' '}
            <Link
              href="/calendar"
              className="text-eaa-light-blue font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eaa-blue rounded-sm"
            >
              events calendar
            </Link>{' '}
            for upcoming chapter activities.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-eaa-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-900 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eaa-blue"
          >
            Back to Home
          </Link>
          <Link
            href="/members"
            className="bg-eaa-yellow text-eaa-blue px-6 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eaa-blue"
          >
            Member Area
          </Link>
        </div>
      </div>
    </main>
  )
}
