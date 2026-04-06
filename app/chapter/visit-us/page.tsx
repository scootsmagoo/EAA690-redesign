export default function VisitUsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Visit Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Our Location</h2>
          <p className="text-gray-700 mb-1 font-semibold">EAA Chapter 690</p>
          <p className="text-gray-700 mb-4">
            690 Airport Road<br />
            Hangar 1, Briscoe Field<br />
            Lawrenceville, Georgia 30046
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Airport:</strong> Gwinnett County Airport &mdash; Briscoe Field (KLZU)
          </p>
          <p className="text-gray-700">
            <strong>Phone:</strong>{' '}
            <a href="tel:4048572492" className="text-eaa-light-blue hover:underline">(404) 857-2492</a>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Regular Meetings</h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              <span className="font-semibold">1st Saturday Pancake Breakfast</span><br />
              8:00 &ndash; 10:00 AM &bull; Program at 10:00 AM
            </li>
            <li>
              <span className="font-semibold">Youth Aviation Build Program</span><br />
              2nd, 3rd &amp; 4th Saturday &bull; 9:00 AM &ndash; 1:00 PM
            </li>
            <li>
              <span className="font-semibold">VMC/IMC Club</span><br />
              3rd Thursday monthly &bull; 7:00 &ndash; 9:00 PM
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-eaa-blue text-white p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-3">We Welcome Visitors!</h2>
        <p className="mb-3">
          Whether you&apos;re a pilot, aviation enthusiast, or just curious about flight, you&apos;re welcome to come
          by and see what we&apos;re all about. Our 1st Saturday Pancake Breakfast is a great way to meet the chapter.
        </p>
        <p>
          Check our <a href="/calendar" className="text-eaa-yellow hover:underline">calendar</a> for upcoming events,
          or <a href="/contact" className="text-eaa-yellow hover:underline">contact us</a> with any questions.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-eaa-blue mb-4">Flying In?</h2>
        <p className="text-gray-700 mb-4">
          Gwinnett County Airport &mdash; Briscoe Field (KLZU) is a public-use airport located in Lawrenceville, Georgia,
          approximately 30 miles northeast of downtown Atlanta. Our chapter hangar is at Hangar 1.
        </p>
        <p className="text-gray-700">
          For airport information including NOTAMs and current conditions, visit{' '}
          <a
            href="https://www.airnav.com/airport/KLZU"
            target="_blank"
            rel="noopener noreferrer"
            className="text-eaa-light-blue hover:underline"
          >
            AirNav KLZU
          </a>{' '}
          or check your preferred flight planning service.
        </p>
      </div>
    </div>
  )
}
