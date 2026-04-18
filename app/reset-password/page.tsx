'use client'

import { useState, FormEvent, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PasswordField from '@/components/PasswordField'
import { authClient } from '@/lib/better-auth-client'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''
  // Better Auth appends `?error=invalid_token` (or similar) to redirectTo when it rejects the link
  // before our page even runs — surface that to the user instead of showing the form.
  const linkError = searchParams?.get('error') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (linkError) {
      setError(
        'This password reset link is invalid or has expired. Please request a new one.'
      )
    }
  }, [linkError])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Missing reset token. Please use the link from your email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (resetError) {
        const msg =
          (resetError as { message?: string }).message ||
          'Could not reset your password. The link may have expired — please request a new one.'
        setError(msg)
        return
      }

      setDone(true)
      // Pause before redirect so:
      //  1. Sighted users see the success state register (not a flash).
      //  2. Screen readers have time to announce the polite live-region update before navigation.
      // 2.5s is the minimum SR-friendly delay we settled on; the manual "Sign in now" link below
      // is the fallback for users who don't want to wait or whose SR queue is backed up.
      setTimeout(() => {
        router.push('/sign-in?message=Password+updated.+Please+sign+in.')
      }, 2500)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const tokenMissing = !token && !linkError

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-eaa-blue">
            Choose a new password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter a new password for your EAA 690 account.
          </p>
        </div>

        {done ? (
          <div
            className="rounded-md bg-green-50 border border-green-200 p-6 text-center space-y-2"
            role="status"
            aria-live="polite"
          >
            <h2 className="text-lg font-semibold text-green-900">Password updated</h2>
            <p className="text-sm text-green-800">
              Redirecting you to sign in&hellip;
            </p>
            <p className="text-sm">
              <Link
                href="/sign-in?message=Password+updated.+Please+sign+in."
                className="font-medium text-green-900 underline hover:text-green-700"
              >
                Sign in now
              </Link>
            </p>
          </div>
        ) : tokenMissing ? (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-6 space-y-3" role="status">
            <h2 className="text-base font-semibold text-yellow-900">Reset link required</h2>
            <p className="text-sm text-yellow-800">
              This page requires a one-time link from a password reset email.
            </p>
            <p className="text-sm text-yellow-800">
              <Link href="/forgot-password" className="font-medium underline hover:text-yellow-900">
                Request a new reset link
              </Link>
              .
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
                <div className="text-sm text-red-800">{error}</div>
                {linkError && (
                  <div className="text-sm mt-2">
                    <Link href="/forgot-password" className="font-medium text-red-900 underline hover:text-red-700">
                      Request a new link
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!linkError && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New password
                  </label>
                  <PasswordField
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={setPassword}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm new password
                  </label>
                  <PasswordField
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue sm:text-sm"
                  />
                </div>
              </div>
            )}

            {!linkError && (
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  aria-busy={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-eaa-blue hover:bg-eaa-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eaa-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating…' : 'Update password'}
                </button>
              </div>
            )}
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          Remembered it?{' '}
          <Link href="/sign-in" className="font-medium text-eaa-blue hover:text-eaa-light-blue">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function Fallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-eaa-blue border-t-transparent rounded-full animate-spin" aria-label="Loading" />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResetForm />
    </Suspense>
  )
}
