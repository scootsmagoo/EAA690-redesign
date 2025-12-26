'use client'

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
          <div className="mt-4">
            <Link
              href="/account"
              className="text-eaa-blue hover:text-eaa-light-blue font-medium"
            >
              Manage Account Settings →
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
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
    </AuthGuard>
  )
}

