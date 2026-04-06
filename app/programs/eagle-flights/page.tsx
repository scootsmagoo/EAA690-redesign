export default function EagleFlightsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Eagle Flights</h1>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">What is Eagle Flights?</h2>
          <p className="text-gray-700 mb-4">
            EAA&apos;s Eagle Flights&reg; is a free introductory flight experience and informal mentoring program designed
            to welcome and encourage adults who want to discover flying, but don&apos;t know how or where to take that
            first step.
          </p>
          <p className="text-gray-700 mb-4">
            It begins with a hands-on introduction, where you&apos;ll fly with a local EAA-member pilot who will let you
            follow along at the controls of the airplane to get a feel for what being a pilot is all about. After the
            flight, he or she can help you learn more about how to get involved in your local aviation community,
            including the next steps you can take on the path to becoming a pilot.
          </p>
          <p className="text-gray-700">
            The best part? The whole experience is <strong>free</strong>. No sales. No pressure. Just a whole lot of fun
            and education with a big take-home point: your dream of flying is a lot closer than you think.
          </p>
        </div>

        <div className="bg-eaa-blue text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-3">A Chapter First</h2>
          <p>
            Chapter member Duane Huff flew the first Eagle Flight in the country on August 2nd, 2012.
          </p>
        </div>

        <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to Fly?</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://www.eaa.org/eagleflights"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-eaa-blue text-white px-6 py-3 rounded-md font-semibold hover:bg-eaa-light-blue transition-colors text-center"
            >
              Learn About Eagle Flights&reg;
            </a>
            <a
              href="https://flyingstart.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-eaa-blue text-white px-6 py-3 rounded-md font-semibold hover:bg-eaa-light-blue transition-colors text-center"
            >
              Register for a Flight
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
