import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'

// Content mirrors eaa690.org/hangar-rental (checked Nov 2026).
const HANGAR_APPLICATION_URL = 'https://drive.google.com/file/d/1r4p65F5jpStl1-K4sikL8NlH6j1St5l4/view?usp=sharing'
const HANGAR_EMAIL = 'mailto:info@eaa690.org?subject=Hangar%20Rental%20Request'

export default function MemberHangarRentalPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/members" className="text-sm text-eaa-light-blue hover:underline mb-4 block">
          ← Back to Members Area
        </Link>
        <h1 className="text-4xl font-bold text-eaa-blue mb-8">Chapter Hangar Rental</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <p className="text-gray-700 mb-4">
              The Chapter will rent out the hangar to members for their use. For insurance requirements you will need
              to coordinate with the Chapter President.
            </p>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-eaa-blue mb-4">How to request the hangar</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>
                  Check the{' '}
                  <Link href="/calendar" className="text-eaa-light-blue hover:underline">
                    calendar
                  </Link>{' '}
                  first to make sure the hangar is free.
                </li>
                <li>Complete the EAA 690 Hangar Use Application.</li>
                <li>
                  <a href={HANGAR_EMAIL} className="text-eaa-light-blue hover:underline">
                    Email it to the chapter
                  </a>{' '}
                  at info@eaa690.org.
                </li>
              </ol>
              <a
                href={HANGAR_APPLICATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 bg-eaa-blue text-white px-6 py-2 rounded-md font-semibold hover:bg-eaa-light-blue transition-colors no-underline"
              >
                EAA 690 Hangar Use Application<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </section>

          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-eaa-blue mb-4">Location</h2>
            <p className="text-gray-700 mb-2">
              690 Airport Road
              <br />
              Hangar 1, Briscoe Field
              <br />
              Lawrenceville, Georgia 30046
            </p>
            <p className="text-gray-700 mb-0">
              <strong>Hangar phone:</strong>{' '}
              <a href="tel:4048572492" className="text-eaa-light-blue hover:underline">
                (404) 857-2492
              </a>
            </p>
          </section>
        </div>
      </div>
    </AuthGuard>
  )
}
