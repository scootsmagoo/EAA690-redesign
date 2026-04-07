import ScholarshipForm from '@/components/forms/ScholarshipForm'

export default function ScholarshipsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-4">Scholarship Programs</h1>
      <p className="text-lg text-gray-600 mb-8">
        EAA 690, a 501(c)(3) non-profit, is proud of its work providing scholarships to assist young people in
        furthering their aviation dreams.
      </p>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">How to Apply</h2>
          <p className="text-gray-700 mb-4">
            Our chapter offers two primary scholarships: the <strong>EAA Ray Scholarship</strong> and the{' '}
            <strong>EAA Chapter 690 Scholarship</strong>. Applications are reviewed by our scholarship committee
            and forwarded to the Board of Directors with a recommendation for action.
          </p>
          <p className="text-gray-700 mb-4">
            Scholarships are also available for young people interested in pursuing aviation careers beyond piloting.
            The chapter will not award a flight instruction scholarship until a candidate has reached the milestone
            of soloing.
          </p>
          <p className="text-gray-700 mb-4">
            You can apply using the online form below, or download and submit a PDF application if you prefer.
          </p>
          <a
            href="https://drive.google.com/file/d/1uhbK2Q8RKnO_kWB5lTDNr4AANKZ1uEJb/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-100 text-eaa-blue border border-gray-300 px-5 py-2 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            ↓ Download PDF Application (alternative)
          </a>
        </div>

        <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-3">Ray Aviation Scholarship</h2>
          <p className="mb-3">
            Through the generous support of the Ray Foundation, EAA provides up to <strong>$10,000</strong> to
            deserving youths for their flight training expenses — totaling nearly $1.2 million in scholarships annually
            across 100+ chapters.
          </p>
          <p className="mb-4">
            Each year, our chapter supports one scholar between the ages of 16 and 19 with funding and mentorship to
            help earn their private pilot certificate. The Ray Scholarship is applied for in January of every year.
          </p>
          <a
            href="https://drive.google.com/file/d/12dww6BVkD-kC04q2H6J8OKme6lJGU6Bt/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-eaa-blue text-white px-5 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-colors"
          >
            ↓ Ray Scholarship PDF Application
          </a>
        </div>

        {/* Online Application Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-eaa-blue mb-2">Apply Online</h2>
          <p className="text-gray-600 text-sm mb-6">
            Prefer to apply online? Fill out the form below — your application will be received by the scholarship
            committee directly.
          </p>
          <ScholarshipForm />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Additional Scholarship Resources</h2>
          <ul className="space-y-4">
            <li>
              <a
                href="https://www.eaa.org/eaa/learn-to-fly/scholarships"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eaa-light-blue hover:underline font-semibold"
              >
                EAA Flight Training & Post-Secondary Scholarships
              </a>
              <p className="text-gray-600 text-sm mt-1">
                Whether you dream of becoming a pilot or earning an additional rating, EAA offers additional
                scholarship opportunities through their national programs.
              </p>
            </li>
            <li>
              <a
                href="https://www.aopa.org/training-and-safety/students/flight-training-scholarships"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eaa-light-blue hover:underline font-semibold"
              >
                AOPA Flight Training Scholarships
              </a>
              <p className="text-gray-600 text-sm mt-1">
                The Aircraft Owners and Pilots Association offers a range of scholarships for student pilots.
              </p>
            </li>
            <li>
              <a
                href="https://valeri-aviation.thinkific.com/courses/aerospace-scholarships-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eaa-light-blue hover:underline font-semibold"
              >
                Valeri Aviation Scholarship Guide
              </a>
              <p className="text-gray-600 text-sm mt-1">
                A comprehensive list of 50+ aviation scholarships updated annually from public and private sources.
                EAA 690 is not directly affiliated; access is currently $10/year.
              </p>
            </li>
            <li>
              <a
                href="https://gbaa11.wildapricot.org/scholarships"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eaa-light-blue hover:underline font-semibold"
              >
                Georgia Business Aviation Association (gbAA) Scholarships
              </a>
              <p className="text-gray-600 text-sm mt-1">
                Available to Georgia high school graduates (3.0 GPA or better) enrolling full-time in accredited
                U.S. colleges or technical schools in aviation fields.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
