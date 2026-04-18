'use client'

import { useState, FormEvent, useRef } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/better-auth-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Better Auth's `requestPasswordReset` always returns success regardless of whether the
      // email is registered (anti-enumeration — see request-password-reset.mjs). The `redirectTo`
      // is the page Better Auth bounces the user to after validating their one-time token; we
      // make it absolute so the server-side originCheck accepts it across environments.
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : '/reset-password'

      const { error: resetError } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo,
      })

      if (resetError) {
        // Generic transport-level failure (network, server config, rate limit). We don't surface
        // specifics — we don't want to differentiate "email not found" from "Resend down" from
        // "rate-limited", since combining those signals enables enumeration / probing.
        setError('We could not send the reset email right now. Please try again in a moment.')
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Password reset error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-eaa-blue">
            Reset your password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/sign-in" className="font-medium text-eaa-blue hover:text-eaa-light-blue">
              sign in to your account
            </Link>
          </p>
        </div>

        {submitted ? (
          <div
            className="rounded-md bg-green-50 border border-green-200 p-6 text-center space-y-4"
            role="status"
            aria-live="polite"
          >
            <h2 className="text-lg font-semibold text-green-900">Check your email</h2>
            <p className="text-sm text-green-800">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a link
              you can use to set a new password. The link expires in one hour.
            </p>
            <p className="text-sm text-green-800">
              Didn&apos;t get it? Check your spam folder, or{' '}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setError('')
                  // Schedule focus for the next tick so the input has rendered before we move
                  // focus into it (avoids a no-op when called pre-paint).
                  requestAnimationFrame(() => emailRef.current?.focus())
                }}
                className="underline font-medium hover:text-green-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 rounded-sm"
              >
                try a different email
              </button>
              .
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                ref={emailRef}
                aria-describedby="email-help"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p id="email-help" className="mt-2 text-xs text-gray-500">
                Enter the email associated with your EAA 690 account. We&apos;ll send a link to reset your password.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                aria-busy={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-eaa-blue hover:bg-eaa-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eaa-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
