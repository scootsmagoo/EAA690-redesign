export default function YoungEaglesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Young Eagles</h1>

      <div className="prose max-w-none space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Young Eagle Flights</h2>
          <p className="text-gray-700 mb-4">
            Founded in 1992, the Young Eagles program is dedicated to giving youth ages 8&ndash;17 an opportunity to go
            flying in a general aviation airplane. These flights are offered <strong>free of charge</strong> and are made
            possible through the generosity of EAA member volunteers.
          </p>
          <p className="text-gray-700 mb-4">
            It&apos;s the only program of its kind, with the sole mission to introduce and inspire kids in the world of
            aviation. Today, the Young Eagles program has flown over 2 million kids, and EAA 690 has flown Young Eagles
            for over 30 years.
          </p>
          <p className="text-gray-700">
            For more information from EAA headquarters, visit{' '}
            <a
              href="https://www.youngeagles.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-eaa-light-blue hover:underline"
            >
              www.youngeagles.org
            </a>
            , or register at{' '}
            <a
              href="http://events.eaachapters.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-eaa-light-blue hover:underline"
            >
              Young Eagles Day
            </a>{' '}
            for a flight.
          </p>
        </div>

        <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-3">Chapter Young Eagles Coordinator</h2>
          <p className="text-lg font-semibold mb-1">Brian Falony</p>
          <a
            href="mailto:youngeagles@eaa690.org"
            className="underline hover:opacity-75"
          >
            youngeagles@eaa690.org
          </a>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Want to Volunteer?</h2>
          <p className="text-gray-700 mb-4">
            If you haven&apos;t yet volunteered as a pilot or ground crew member,{' '}
            <a
              href="https://youngeaglesday.org/?yesignup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-eaa-light-blue hover:underline"
            >
              sign up here
            </a>
            . No prior experience is necessary for ground crew roles.
          </p>
          <p className="text-gray-700">
            Every rally is a team effort, and there&apos;s a role for everyone — from pilots to registration
            volunteers to ground crew.
          </p>
        </div>
      </div>
    </div>
  )
}
