export default function GeneralInfoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">General Information</h1>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">About EAA Chapter 690</h2>
          <p className="text-gray-700 mb-4">
            EAA 690 is a Chapter of the Experimental Aircraft Association, located at Briscoe Field (KLZU) in
            Lawrenceville, Georgia. A diverse chapter with over 250 members, awarded EAA&apos;s top level{' '}
            <strong>Gold Chapter status</strong>, we offer a wide range of aviation-related activities on a regular basis.
          </p>
          <p className="text-gray-700 mb-4">
            While the Pancake Breakfast and our monthly meetings are the norm, we are also heavily involved in youth education
            through EAA&apos;s Young Eagles program and our youth build programs, regularly conduct fly-outs, and host historical
            aircraft such as EAA&apos;s B-17 &quot;Aluminum Overcast&quot; and the Ford Tri-Motor.
          </p>
          <p className="text-gray-700">
            Founded in 1980, the chapter is an IRS-approved <strong>501(c)(3) non-profit entity</strong>.
          </p>
        </div>

        <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
          <p className="mb-3">
            &hellip;to all the pilots, ground crew, and registration volunteers for our recent Young Eagle rally.
            If you haven&apos;t yet volunteered,{' '}
            <a
              href="https://youngeaglesday.org/?yesignup"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-75"
            >
              sign up here
            </a>
            . No prior experience is necessary.
          </p>
          <p>
            If working with youth is your interest, the Youth Aviation Build program needs additional mentors to support and
            grow the program. The Saturday program runs from 9 AM until 1 PM and could be the most rewarding thing you have
            ever done in aviation. You will never know until you try it!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Stay Connected on Slack</h2>
          <p className="text-gray-700 mb-4">
            Are you using Slack? Anyone is welcome to join by contacting any participating member and having them send you
            an invitation. There are many interests to choose from.
          </p>
          <p className="text-gray-700">
            Slack is a great way to stay up to date on chapter activities, ask questions, and connect with fellow members
            between meetings.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Location</h2>
          <p className="text-gray-700 mb-1"><strong>Address:</strong></p>
          <p className="text-gray-700 mb-4">
            690 Airport Road<br />
            Hangar 1, Briscoe Field<br />
            Lawrenceville, Georgia 30046
          </p>
          <p className="text-gray-700">
            <strong>Airport:</strong> Gwinnett County Airport &mdash; Briscoe Field (KLZU)
          </p>
          <p className="text-gray-700 mt-2">
            <strong>Hangar Phone:</strong>{' '}
            <a href="tel:4048572492" className="text-eaa-light-blue hover:underline">(404) 857-2492</a>
          </p>
        </div>
      </div>
    </div>
  )
}
