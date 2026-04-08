import Link from 'next/link'
import { Suspense } from 'react'
import ClearCartOnSuccess from './ClearCartOnSuccess'

export default function StoreSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <ClearCartOnSuccess />
      </Suspense>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" focusable="false">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-eaa-blue mb-3">Order Confirmed!</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Thank you for your purchase. A receipt has been sent to your email.
          If you have any questions about your order, please contact us.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/store"
            className="bg-eaa-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-900 transition-colors"
          >
            Back to Store
          </Link>
          <Link
            href="/contact"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
