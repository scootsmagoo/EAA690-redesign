import SummerCampForm from '@/components/forms/SummerCampForm'
import ProgramRegistrationClosed from '@/components/program/ProgramRegistrationClosed'
import { getProgramFormsSettings } from '@/lib/program-forms-sanity'

export const dynamic = 'force-dynamic'

export default async function SummerCampPage() {
  const pf = await getProgramFormsSettings()
  const camp = pf.summerCamp

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-4">Aviation STEM Summer Camp</h1>
      <p className="text-lg text-gray-600 mb-8">
        For youth ages 12&ndash;18 &bull; Gwinnett County Airport (KLZU) &bull; Lawrenceville, Georgia
      </p>

      <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-2">2026 Camp Update</h2>
        <p>
          As of February 18, 2026, seats and waitlists are filled for our 2026 Alpha and Bravo Groups.
          Students ages 16&ndash;18 may join the waitlist for Charlie Group using the form below.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-eaa-blue mb-4">2026 Camp Details</h2>
        <p className="text-gray-700 mb-4">
          Our immersive aviation-focused STEM program is held in our chapter hangar at Gwinnett County Airport.
          The <strong>2026 camp runs June 15&ndash;19</strong>, with a free Young Eagles flight on Saturday, June 20th.
        </p>
        <p className="text-gray-700 mb-4">
          Students in 7th through 12th grade may apply. Sample topics include Aircraft Construction Methods,
          Principles of Aeronautics, Unmanned Aircraft, Helicopter Flight, and Ground and Flight Instruction.
          Camp is held daily from 9:00 AM to 4:00 PM. Students provide their lunches Monday&ndash;Thursday;
          Friday lunch is provided.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { group: 'Alpha Group', ages: 'Ages 12&ndash;13', cost: '$375', note: 'Waitlist full' },
            { group: 'Bravo Group', ages: 'Ages 14&ndash;15', cost: '$375', note: 'Waitlist full' },
            { group: 'Charlie Group', ages: 'Ages 16&ndash;18', cost: '$575', note: 'Waitlist open' },
          ].map((g) => (
            <div key={g.group} className="bg-gray-50 rounded-lg p-4 text-center">
              <h3 className="font-bold text-eaa-blue text-lg mb-1">{g.group}</h3>
              <p className="text-gray-600 text-sm mb-1" dangerouslySetInnerHTML={{ __html: g.ages }} />
              <p className="font-semibold text-eaa-blue text-xl mb-2">{g.cost}</p>
              <p className="text-sm text-gray-500">{g.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-eaa-blue mb-4">A Six-Year Journey</h2>
        <p className="text-gray-700 mb-4">
          Our Aviation Focused STEM Summer Camp program has been carefully planned to give a 12-year-old six years of
          camp experiences — provided both by EAA 690 and by the national EAA organization in Oshkosh, Wisconsin.
        </p>
        <ul className="space-y-2 text-gray-700 list-disc list-inside">
          <li>Age 12: EAA 690 Alpha STEM Camp</li>
          <li>Age 13: EAA <a href="https://www.eaa.org/eaa/youth/eaa-aviation-and-flight-summer-camps/eaa-air-academy" target="_blank" rel="noopener noreferrer" className="text-eaa-light-blue hover:underline">Air Academy Camp</a> in Oshkosh</li>
          <li>Age 14: EAA 690 Bravo STEM Camp</li>
          <li>Age 15: EAA Air Academy (new experience) in Oshkosh</li>
          <li>Age 16: EAA 690 Charlie STEM Flight Training Camp</li>
          <li>Age 17: EAA Oshkosh — most advanced camp + AirVenture</li>
        </ul>
        <p className="text-gray-600 text-sm mt-4">
          The chapter works hard to help campers going to Oshkosh with travel expenses as funds allow. National{' '}
          <a href="https://www.eaa.org/eaa/learn-to-fly/scholarships/eaa-air-academy-camperships" target="_blank" rel="noopener noreferrer" className="text-eaa-light-blue hover:underline">Camperships</a>{' '}
          are also available for those attending EAA camps.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-eaa-blue mb-2">Join the Waitlist</h2>
        {camp.registrationOpen ? (
          <>
            <p className="text-gray-600 text-sm mb-6">
              Fill out the form below and we&apos;ll contact you as spots open up. Chapter members receive priority consideration.
            </p>
            <SummerCampForm />
          </>
        ) : (
          <ProgramRegistrationClosed title="Waitlist signup unavailable" message={camp.closedMessage} />
        )}
      </div>

      <div className="bg-eaa-blue text-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-3">Stay Informed for 2027</h2>
        <p className="mb-3">
          Sign up for our newsletter to receive updates. Chapter members receive priority for our 2027 Aviation
          Summer Camp.
        </p>
        <a
          href="/join"
          className="inline-block bg-eaa-yellow text-eaa-blue px-6 py-3 rounded-md font-semibold hover:bg-yellow-400 transition-colors"
        >
          Join / Renew Membership
        </a>
      </div>
    </div>
  )
}
