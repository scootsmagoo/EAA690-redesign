export default function OutreachPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Outreach</h1>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Heidi&hellip; the Helicopter Trainer</h2>
          <p className="text-gray-700 mb-4">
            Several years ago, chapter member Chuck Roberts took it upon himself to build a helicopter trainer&hellip;
            from scratch. He purchased the FAA&apos;s Helicopter Flying Handbook, read it, drafted the plans, and built
            it. Definitely a remarkable achievement — it has all the functional parts of a real helicopter and allows
            anyone to easily visualize how they work.
          </p>
          <p className="text-gray-700 mb-4">
            This would be daunting for most people, but not for Chuck, who is a retired electrical engineer and an
            all-around wizard with things mechanical.
          </p>
          <p className="text-gray-700">
            It&apos;s a wonderful teaching tool, and we can bring it to your school or event with advance notice.
          </p>
        </div>

        <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-3">Schedule an Appearance</h2>
          <p className="mb-4">
            To schedule an appearance at your school or event, please contact us and one of our chapter members
            will follow up to confirm our participation.
          </p>
          <a
            href="/contact"
            className="inline-block bg-eaa-blue text-white px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  )
}
