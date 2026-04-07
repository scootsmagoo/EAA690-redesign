import VmcImcForm from '@/components/forms/VmcImcForm'

export default function VmcImcClubPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">VMC/IMC Club</h1>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">About the Club</h2>
          <p className="text-gray-700 mb-4">
            Our Visual Meteorological Conditions (VMC) and Instrument Meteorological Conditions (IMC) Club offers
            monthly meetings in which pilots can network and share knowledge and experience.
          </p>
          <p className="text-gray-700 mb-4">
            The meetings use real-world scenarios to engage members, allowing a free exchange of information that
            improves awareness and skills. The intent is to create a community of pilots willing to share information,
            provide recognition, foster communications, promote safety, and build proficiency.
          </p>
          <p className="text-gray-700">
            The VMC Club monthly programming is developed and produced by EAA, but it does not use a lecture or
            presentation format. Instead, an actual scenario is presented and followed by group discussion —
            audience participation is encouraged! Since everyone has a different experience level and aircraft,
            we can all benefit from the conversation.
          </p>
        </div>

        <div className="bg-eaa-blue text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Meeting Details</h2>
          <ul className="space-y-3">
            <li><span className="font-semibold">When:</span> Monthly — every 3rd Thursday, 7:00&ndash;9:00 PM</li>
            <li>
              <span className="font-semibold">Where:</span> EAA 690 Chapter Hangar<br />
              <span className="ml-[5.25rem]">690 Airport Road, Hangar #1</span><br />
              <span className="ml-[5.25rem]">Lawrenceville, GA 30046</span>
            </li>
            <li>
              <span className="font-semibold">Contact:</span>{' '}
              <a
                href="mailto:crserra@yahoo.com?subject=VMC Club"
                className="text-eaa-yellow hover:underline"
              >
                Chris Serra
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-3">All Pilots Welcome</h2>
          <p className="text-gray-700">
            You don&apos;t need to be an instrument-rated pilot to participate. The club is open to all EAA 690
            members and pilots who want to improve their situational awareness and decision-making skills.
          </p>
        </div>

        {/* Interest Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-eaa-blue mb-2">Get Notified About Upcoming Meetings</h2>
          <p className="text-gray-600 text-sm mb-6">
            Submit your information and Chris Serra will be in touch before the next meeting.
          </p>
          <VmcImcForm />
        </div>
      </div>
    </div>
  )
}
