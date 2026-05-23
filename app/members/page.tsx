import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'

export default function MembersPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-eaa-blue mb-8">Members Area</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-eaa-blue mb-4">Welcome, Member!</h2>
          <p className="text-gray-700 mb-4">
            This is a protected members-only area. Only authenticated users can access this content.
          </p>
          <p className="text-gray-700">
            You are logged in with your EAA 690 account. Welcome to the members area!
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/account"
              className="text-eaa-blue hover:text-eaa-light-blue font-medium"
            >
              Manage Account Settings →
            </Link>
            <Link
              href="/members/hangar-rental"
              className="text-eaa-blue hover:text-eaa-light-blue font-medium"
            >
              Hangar Rental →
            </Link>
            <Link href="/members/bylaws" className="text-eaa-blue hover:text-eaa-light-blue font-medium">
              Bylaws →
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/members/hangar-rental"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-eaa-yellow"
          >
            <h3 className="text-xl font-bold text-eaa-blue mb-2">Hangar Rental</h3>
            <p className="text-gray-700">
              View hangar rental information, water agreements, and inquiry details for chapter members.
            </p>
          </Link>

          <Link
            href="/members/bylaws"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-eaa-yellow"
          >
            <h3 className="text-xl font-bold text-eaa-blue mb-2">Bylaws</h3>
            <p className="text-gray-700">
              Download chapter bylaws and review governance documents for EAA 690.
            </p>
          </Link>

          <div className="bg-blue-50 p-6 rounded-lg md:col-span-2">
            <h3 className="text-xl font-bold text-eaa-blue mb-4">Member Benefits</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Access to exclusive member content</li>
              <li>Event registration and management</li>
              <li>Member directory access</li>
              <li>Newsletter archives</li>
              <li>Special member discounts</li>
            </ul>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
