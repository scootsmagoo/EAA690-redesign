import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'

export default function MemberHangarRentalPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/members" className="text-sm text-eaa-light-blue hover:underline mb-4 block">
          ← Back to Members Area
        </Link>
        <h1 className="text-4xl font-bold text-eaa-blue mb-8">Hangar Rental</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eaa-blue mb-4">Hangar Space Available</h2>
            <p className="text-gray-700 mb-6">
              EAA 690 offers hangar rental space at Briscoe Field (KLZU) in Lawrenceville, Georgia. Our hangar
              facilities provide secure storage for aircraft and aviation-related equipment.
            </p>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold text-eaa-blue mb-4">Location</h3>
              <p className="text-gray-700 mb-2">
                <strong>Address:</strong><br />
                690 Airport Road<br />
                Hangar 1, Briscoe Field<br />
                Lawrenceville, Georgia 30046
              </p>
              <p className="text-gray-700">
                <strong>Airport:</strong> Briscoe Field (KLZU)
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eaa-blue mb-4">Rental Information</h2>
            <p className="text-gray-700 mb-4">
              Hangar space is available for rent to chapter members and the aviation community. Rental terms and
              availability vary based on space and demand.
            </p>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold text-eaa-blue mb-4">Features</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Secure aircraft storage</li>
                <li>Climate-controlled options available</li>
                <li>Easy access to runway</li>
                <li>24/7 security</li>
                <li>Maintenance workspace</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eaa-blue mb-4">Rental Process</h2>
            <p className="text-gray-700 mb-4">
              To inquire about hangar rental availability and rates, please{' '}
              <a href="/contact" className="text-eaa-light-blue hover:underline">contact us</a>. We&apos;ll be happy
              to discuss your needs and available options.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-eaa-blue mb-4">What to Include in Your Inquiry</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Aircraft type and size</li>
                <li>Desired rental period</li>
                <li>Special requirements (climate control, workspace, etc.)</li>
                <li>Contact information</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eaa-blue mb-4">Water Agreements</h2>
            <p className="text-gray-700 mb-4">
              The chapter manages water agreements for hangar tenants. This includes arrangements for new tenants
              and coordination with entities such as Civil Air Patrol for water meter installations.
            </p>
            <p className="text-gray-700">
              For information about water agreements or to discuss your specific needs, please{' '}
              <a href="/contact" className="text-eaa-light-blue hover:underline">contact us</a>.
            </p>
          </section>

          <section className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Priority for Chapter Members</h3>
            <p>
              EAA 690 chapter members receive priority consideration for hangar rental space. If you&apos;re interested
              in joining the chapter, please visit our{' '}
              <a href="/contact" className="underline hover:text-eaa-light-blue">contact page</a> for membership
              information.
            </p>
          </section>
        </div>
      </div>
    </AuthGuard>
  )
}
