'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PasswordField from '@/components/PasswordField'
import { signIn } from '@/lib/better-auth-client'

/** Only allow relative paths — reject absolute URLs to prevent open redirect. */
function safeRedirect(value: string | null): string {
  if (value && /^\/(?!\/)/.test(value)) return value
  return '/members'
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirect(searchParams?.get('redirect'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn.email({ email, password })
      if (result.error) {
        setError((result.error as { message?: string }).message || 'Invalid email or password')
        return
      }
      router.push(redirect)
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-eaa-blue">
            Welcome back
          </h1>
          <div className="mt-6 flex rounded-lg border border-gray-200 overflow-hidden" role="tablist">
            <span
              className="flex-1 py-2 px-4 text-sm font-semibold text-center bg-eaa-blue text-white"
              aria-current="page"
            >
              Login
            </span>
            <Link
              href="/signup"
              className="flex-1 py-2 px-4 text-sm font-semibold text-center bg-white text-eaa-blue hover:bg-gray-50 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {/* role="alert" ensures screen readers announce errors immediately on submit */}
          {error && (
            <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <PasswordField
                id="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="Password"
                value={password}
                onChange={setPassword}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue focus:z-10 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-eaa-blue focus:ring-eaa-blue border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-eaa-blue hover:text-eaa-light-blue">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-eaa-blue hover:bg-eaa-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eaa-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-eaa-blue border-t-transparent rounded-full animate-spin" aria-label="Loading" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
