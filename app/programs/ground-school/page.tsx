export default function GroundSchoolPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Ground School</h1>

      <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-2">Currently on Hiatus</h2>
        <p>
          EAA 690&apos;s Ground School sessions are currently on hiatus as we evaluate the best approach to deliver
          this training properly.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-eaa-blue mb-4">About Ground School</h2>
        <p className="text-gray-700 mb-4">
          Ground school instruction covers the foundational knowledge required to earn a Private Pilot certificate,
          including aerodynamics, weather, navigation, regulations, and aircraft systems.
        </p>
        <p className="text-gray-700">
          When our program resumes, it will be open to both chapter members and the broader community. Stay tuned
          to our newsletter and calendar for announcements.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-eaa-blue mb-4">Interested in Updates?</h2>
        <p className="text-gray-700 mb-4">
          If you&apos;d like to be notified when Ground School resumes, or if you&apos;re interested in helping
          instruct, please reach out to us.
        </p>
        <a
          href="/contact"
          className="inline-block bg-eaa-blue text-white px-6 py-3 rounded-md font-semibold hover:bg-eaa-light-blue transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  )
}
