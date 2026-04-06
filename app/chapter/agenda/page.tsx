export default function AgendaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-2">Board of Directors Meeting</h1>
      <p className="text-gray-500 mb-8">December 11th, 2025 &mdash; 7:00 PM</p>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <ol className="space-y-6 text-gray-700 list-decimal list-inside">
            <li className="font-semibold text-eaa-blue text-lg">Call to order.</li>
            <li className="font-semibold text-eaa-blue text-lg">Approve minutes from prior meeting.</li>
            <li>
              <span className="font-semibold text-eaa-blue text-lg">Committee reports</span>
              <ul className="mt-3 ml-6 space-y-1 list-disc text-gray-600 font-normal">
                <li>Finance</li>
                <li>BOT &mdash; searching for Chairperson</li>
                <li>Food Service</li>
                <li>Membership</li>
                <li>Publicity</li>
                <li>Scholarship</li>
                <li>Summer Camp</li>
                <li>Young Eagles / Eagles</li>
                <li>Youth Program</li>
              </ul>
            </li>
            <li>
              <span className="font-semibold text-eaa-blue text-lg">Unfinished Business</span>
              <ul className="mt-3 ml-6 space-y-1 list-disc text-gray-600 font-normal">
                <li>Results of chapter member vote on engine acquisition for RV-9 proposal.</li>
                <li>Youth credits earned/expired — tabled until December BOD meeting.</li>
                <li>Status of new chapter e-mail platform.</li>
                <li>2026&ndash;2029 BOT members: Ralph Kirkland and two open seats.</li>
                <li>Status of mini-split AC unit install for simulator room.</li>
              </ul>
            </li>
            <li>
              <span className="font-semibold text-eaa-blue text-lg">New Business</span>
              <div className="mt-3 ml-6 text-gray-600 font-normal">
                <p className="mb-2 font-semibold text-gray-700">A. Transition Plan for:</p>
                <ul className="space-y-1 list-disc ml-4 mb-4">
                  <li>NavCom</li>
                  <li>Airport Visits</li>
                  <li>PB Presentations</li>
                  <li>Airport Authority Liaison</li>
                  <li>Water Agreements</li>
                  <li>New tenant, Hangar 5 &mdash; Cirrus Management</li>
                  <li>Civil Air Patrol water meters</li>
                  <li>Eagle Flight Requests</li>
                  <li>Squarespace dues payments</li>
                </ul>
              </div>
            </li>
            <li className="font-semibold text-eaa-blue text-lg">Member Submitted Item</li>
            <li className="font-semibold text-eaa-blue text-lg">Adjourn</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
