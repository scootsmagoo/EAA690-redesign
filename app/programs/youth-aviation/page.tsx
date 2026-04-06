export default function YouthAviationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-4">Youth Aviation Program</h1>
      <p className="text-lg text-gray-600 mb-8">EAA 690 has a very active Youth Aviation Program — with a robust build program too.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: 'Dream it', body: "The build program currently meets on the 2nd, 3rd & 4th Saturday each month from 9:00 AM to 1:00 PM. Our mentors guide youth through the process of building real airplanes. Current projects include a Zenith 601XLB, a Thorpe T-18, a full motion simulator, and various radio-controlled models." },
          { title: 'Build it', body: 'The program is available for youth age 14 and up. Participants earn credits for the time they work, which can be applied toward flight training in the future. The program has a maximum capacity of twelve participants.' },
          { title: 'The Details', body: 'As with anything, there is paperwork involved. See the documents below for program information, the student pledge, photo/tool permission, and medical guidelines.' },
        ].map((item) => (
          <div key={item.title} className="bg-eaa-blue text-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3">{item.title}</h2>
            <p className="text-sm leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-eaa-blue mb-4">Program Documents</h2>
        <ul className="space-y-3">
          {[
            { label: 'Youth Aviation Program Overview', url: 'https://drive.google.com/file/d/1lwDiW5br67uh6k5EHPL2QDkIBrDCVpkw/view?usp=sharing' },
            { label: 'Student Pledge of Participation', url: 'https://drive.google.com/file/d/1rKzGUB_J_3Xx-Vj68qaIizG_Y1eVhtTv/view?usp=sharing' },
            { label: 'Photo and Tool Permission Form', url: 'https://drive.google.com/file/d/16mKQYIqzUePRp9UNdF81DDtUHdN108Bq/view?usp=sharing' },
            { label: 'Medical Guidelines', url: 'https://drive.google.com/file/d/1RtRbCIyPlbqc7n-7SpJIPpzi941WlPhn/view?usp=sharing' },
          ].map((doc) => (
            <li key={doc.label}>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-eaa-light-blue hover:underline flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {doc.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-3">Interested in Joining or Mentoring?</h2>
        <p className="mb-4">
          If you have a youth with a keen interest in aviation, or if you&apos;re interested in becoming a mentor,
          please reach out to our youth program leadership.
        </p>
        <a
          href="mailto:youth@eaa690.org?subject=Youth Aviation Program Inquiry"
          className="inline-block bg-eaa-blue text-white px-6 py-3 rounded-md font-semibold hover:bg-eaa-light-blue transition-colors"
        >
          Email Youth Program Leadership
        </a>
      </div>
    </div>
  )
}
