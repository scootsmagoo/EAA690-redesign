export default function AopaTeenMembershipPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">AOPA Teen Membership</h1>

      <div className="space-y-8">
        <div className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-3">Free for Teens Ages 13&ndash;18</h2>
          <p className="text-lg mb-4">
            The Aircraft Owners and Pilots Association (AOPA) offers a <strong>FREE</strong> teen membership for
            US residents between the ages of 13 and 18.
          </p>
          <a
            href="https://www.aopa.org/account/av8rsjoinform?offercode=H14XXWYAHP"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-eaa-blue text-white px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-colors"
          >
            Sign Up for Free Teen Membership
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Member Benefits Include</h2>
          <ul className="space-y-3 text-gray-700">
            {[
              'Flight Training magazine, digital edition',
              'Special scholarship opportunities',
              'Flight training helpline for advice and guidance',
              'Online tools to explore airports and places to fly',
              'Access to interactive safety courses and quizzes',
              'AOPA app featuring aviation video content and podcasts',
              'Access to the Flight Training College Aviation directory',
            ].map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-eaa-blue shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-3">Questions?</h2>
          <p className="text-gray-700">
            If you have questions about the AOPA teen membership or want to learn more about getting involved in
            aviation, <a href="/contact" className="text-eaa-light-blue hover:underline">contact us</a> or visit{' '}
            <a href="https://www.aopa.org" target="_blank" rel="noopener noreferrer" className="text-eaa-light-blue hover:underline">aopa.org</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
