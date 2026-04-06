'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Admin Setup Page
 *
 * Only accessible when no admin account exists yet.
 * Once setup is complete this page redirects to /sign-in automatically.
 */
export default function AdminSetupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Redirect away if setup is already complete
  useEffect(() => {
    fetch('/api/admin/setup')
      .then((r) => r.json())
      .then((data) => {
        if (data.setupComplete) {
          router.replace('/sign-in')
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Checking setup status…</p>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Call the server-side API route that handles admin creation
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const msg = [data.error, data.details].filter(Boolean).join(' — ')
        setError(msg || 'Failed to create admin account')
      } else {
        setSuccess(data.message || 'Admin account created successfully! You can now log in.')
        // Clear form
        setEmail('')
        setPassword('')
        setName('')
        // Redirect to login after a delay
        setTimeout(() => {
          router.push('/sign-in')
        }, 2000)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Admin setup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-eaa-blue">
            Create Admin Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set up the first administrator account for EAA 690
          </p>
          <p className="mt-2 text-center text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            This page is only accessible before the first admin account is created.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">{success}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue sm:text-sm"
                placeholder="Admin User"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue sm:text-sm"
                placeholder="admin@eaa690.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-eaa-blue focus:border-eaa-blue sm:text-sm"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-eaa-blue hover:bg-eaa-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eaa-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating admin account...' : 'Create Admin Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

