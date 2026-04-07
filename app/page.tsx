import Link from 'next/link'
import CookieBanner from '@/components/CookieBanner'

// Update this URL each month when a new newsletter is published to Google Drive.
const LATEST_NEWSLETTER_URL = 'https://drive.google.com/file/d/1oRU-HD5w5tQOrBfrBBgzzt_hvzhz0oBb/view'

const PROGRAMS = [
  {
    icon: '✈️',
    name: 'Young Eagles',
    description: 'Free first flights for youth ages 8–17. EAA 690 has flown Young Eagles for over 30 years.',
    href: '/programs/young-eagles',
    cta: 'Register for a Flight',
  },
  {
    icon: '🏕️',
    name: 'Aviation Summer Camp',
    description: 'A week-long immersive STEM aviation program for youth 12–18 at Gwinnett County Airport.',
    href: '/programs/summer-camp',
    cta: 'Join the Waitlist',
  },
  {
    icon: '🎓',
    name: 'Scholarships',
    description: 'The Ray Aviation Scholarship and Chapter 690 Scholarship help young pilots reach their goals.',
    href: '/programs/scholarships',
    cta: 'Apply Now',
  },
  {
    icon: '🔧',
    name: 'Youth Aviation Program',
    description: 'Youth ages 14+ build real airplanes in our hangar — earning credits toward future flight training.',
    href: '/programs/youth-aviation',
    cta: 'Express Interest',
  },
  {
    icon: '🛩️',
    name: 'VMC/IMC Club',
    description: 'Monthly scenario-based safety meetings every 3rd Thursday. Open to all pilots and enthusiasts.',
    href: '/programs/vmc-imc-club',
    cta: 'Get Notified',
  },
  {
    icon: '🦅',
    name: 'Eagle Flights',
    description: 'Introductory flights for adults to experience general aviation firsthand.',
    href: '/programs/eagle-flights',
    cta: 'Learn More',
  },
]

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold text-eaa-blue mb-6">
              Welcome to EAA 690
            </h1>
            <p className="text-lg text-gray-700 mb-4">
              EAA 690 is a Chapter of the Experimental Aircraft Association, located at{' '}
              <strong>Briscoe Field (KLZU)</strong> in Lawrenceville, Georgia. A diverse chapter with over{' '}
              <strong>250 members</strong>, awarded EAA&apos;s top level{' '}
              <strong>Gold Chapter status</strong>, we offer a wide range of aviation-related activities on a regular basis.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              While the Pancake Breakfast and our monthly meetings are the norm, we are also heavily involved in youth education
              through EAA&apos;s Young Eagles program and our youth build programs, regularly conduct fly-outs, and host historical
              aircraft such as EAA&apos;s B-17 &quot;Aluminum Overcast&quot; and the Ford Tri-Motor.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Founded in 1980, the chapter is an <strong>IRS-approved 501(c)(3) non-profit entity</strong>.{' '}
              <a
                href={LATEST_NEWSLETTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-eaa-light-blue underline hover:text-eaa-blue"
              >
                Here&apos;s a link to our latest newsletter for your perusal…
                {/* W8: Inform AT users that the link opens in a new tab */}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/donate"
                className="bg-eaa-yellow text-eaa-blue px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors text-center"
              >
                DONATE TODAY!
              </Link>
              <Link
                href="/join"
                className="bg-eaa-yellow text-eaa-blue px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors text-center"
              >
                Join/Renew EAA 690!
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-eaa-yellow rounded-full flex items-center justify-center shadow-lg">
              <div className="text-center">
                <div className="text-eaa-blue font-bold text-2xl mb-2">GOLD</div>
                <div className="text-eaa-blue font-bold text-xl">CHAPTER</div>
                <div className="text-eaa-blue text-sm mt-2">EAA 020-202</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Showcase */}
      <section className="py-16 bg-white border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-eaa-blue mb-3">Get Involved</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From free youth flights to scholarships and hands-on build programs — there&apos;s a place for everyone at EAA 690.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAMS.map((program) => (
              <div
                key={program.name}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col p-6"
              >
                <div className="text-4xl mb-4">{program.icon}</div>
                <h3 className="text-lg font-bold text-eaa-blue mb-2">{program.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5">{program.description}</p>
                {/* W9: aria-label gives full context; arrow is decorative so aria-hidden prevents "rightwards arrow" announcement */}
                <Link
                  href={program.href}
                  aria-label={`${program.cta} — ${program.name}`}
                  className="inline-block text-center bg-eaa-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-eaa-light-blue transition-colors"
                >
                  {program.cta} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/programs"
              className="inline-block text-eaa-blue border-2 border-eaa-blue px-8 py-3 rounded-full font-bold hover:bg-eaa-blue hover:text-white transition-colors"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Pancake Breakfast Section */}
      <section className="bg-eaa-blue text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            1ST SATURDAY PANCAKE BREAKFAST AND AVIATION PROGRAM
          </h2>
          <div className="text-center space-y-4">
            <p className="text-lg">
              Hosted by the Gwinnett EAA Chapter 690 of the Experimental Aircraft Association.
            </p>
            <div className="bg-white text-eaa-blue p-6 rounded-lg max-w-2xl mx-auto">
              <p className="text-xl mb-2">Breakfast served 8:00 to 10:00 AM</p>
              <p className="text-xl mb-4">Program at 10:00 AM</p>
              <p className="text-red-600 font-bold text-lg">
                Please Note: Breakfast has increased to $10/each!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* April Presentation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">April 5th Presentation at 10 AM</h2>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Alex Ortlano &mdash; &quot;Dust Off&quot;</h3>
          <div className="prose max-w-none mt-6">
            <p className="text-gray-700 mb-4">
              While in his senior year of college, Alex learned to fly in the first year of the Army ROTC Flight Training Program.
              He received his Private Pilot&apos;s Single Engine Land license, and was commissioned as a Second Lieutenant upon graduation.
            </p>
            <p className="text-gray-700 mb-4">
              Alex learned to fly helicopters while attending Army Flight School in Ft. Wolters, TX and Ft. Rucker, AL. He served
              in Vietnam in 1965 with the 57th Medical Detachment (Dustoff), flying out of Tan Son Nhut Airfield in Saigon.
            </p>
            <p className="text-gray-700 mb-4">
              After leaving the Army he applied for and received a Commercial Helicopter License and never flew again.
            </p>
            <p className="text-gray-700">
              In civilian life he was an automobile executive with Ford Motor Company, American Motors Corporation, and Toyota Motor
              Sales, retiring from Toyota in 1998.
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Consent Banner Component */}
      <CookieBanner />
    </div>
  )
}
