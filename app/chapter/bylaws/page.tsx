export default function BylawsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Bylaws</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Chapter Bylaws</h2>
          <p className="text-gray-700 mb-6">
            The bylaws of EAA 690 govern the operations and structure of our chapter. These documents outline the
            rules, procedures, and organizational structure that guide our activities.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold text-eaa-blue mb-4">Download the Bylaws</h3>
            <p className="text-gray-700 mb-4">
              The chapter bylaws may be downloaded using the link below. Bylaws are reviewed periodically and may be
              amended by the membership according to the procedures outlined within.
            </p>
            <a
              href="https://drive.google.com/file/d/1efLhPJE2XmoRK376OFLHMqHBwJ1AZZzx/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-eaa-blue text-white px-6 py-2 rounded-md font-semibold hover:bg-eaa-light-blue transition-colors"
            >
              Download Bylaws (PDF)
            </a>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Document Requests</h2>
          <p className="text-gray-700 mb-4">
            If you need a copy of the bylaws, please{' '}
            <a href="/contact" className="text-eaa-light-blue hover:underline">contact us</a> with your request.
            We&apos;ll be happy to provide you with the documents you need.
          </p>
        </section>

        <section className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Member Access</h3>
          <p className="mb-2">
            All chapter members have the right to review the chapter bylaws. These documents help
            ensure transparency and accountability in chapter operations.
          </p>
          <p>
            If you have questions about the bylaws or would like to propose changes, please don&apos;t
            hesitate to reach out to chapter leadership.
          </p>
        </section>
      </div>
    </div>
  )
}

