import AdminGuard from '@/components/AdminGuard'
import Link from 'next/link'

export default function AdminPage() {
  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-eaa-blue mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">EAA 690 site administration</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-eaa-blue mb-1">User Management</h2>
            <p className="text-gray-500 text-sm mb-4 flex-1">
              View all members and assign Admin, Editor, or Member roles.
            </p>
            <Link
              href="/admin/users"
              className="inline-block px-4 py-2 bg-eaa-blue text-white text-sm rounded-md hover:bg-eaa-light-blue transition-colors text-center"
            >
              Manage Users
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-eaa-blue mb-1">Content Studio</h2>
            <p className="text-gray-500 text-sm mb-4 flex-1">
              Edit events, news, presentations, board members, and site settings via Sanity CMS.
            </p>
            <div className="flex gap-2">
              <Link
                href="/studio"
                className="inline-block px-4 py-2 bg-eaa-blue text-white text-sm rounded-md hover:bg-eaa-light-blue transition-colors text-center"
              >
                Open Studio
              </Link>
              <Link
                href="/admin/content"
                className="inline-block px-4 py-2 border border-eaa-blue text-eaa-blue text-sm rounded-md hover:bg-blue-50 transition-colors text-center"
              >
                Publish Queue
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-eaa-blue mb-1">Program Submissions</h2>
            <p className="text-gray-500 text-sm mb-4 flex-1">
              View, filter, and export form submissions from Summer Camp, Scholarships, VMC/IMC Club, and Youth Aviation.
            </p>
            <Link
              href="/admin/submissions"
              className="inline-block px-4 py-2 bg-eaa-blue text-white text-sm rounded-md hover:bg-eaa-light-blue transition-colors text-center"
            >
              View Submissions
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col opacity-60">
            <h2 className="text-lg font-bold text-eaa-blue mb-1">Site Settings</h2>
            <p className="text-gray-500 text-sm mb-4 flex-1">
              Configure global site settings (coming soon — use Sanity Site Settings for now).
            </p>
            <button
              disabled
              className="inline-block px-4 py-2 bg-gray-300 text-gray-500 text-sm rounded-md cursor-not-allowed text-center"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}

