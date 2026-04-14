'use client'

import { useId, useRef, useState } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function FooterSignup() {
  const inputId = useId()
  const statusId = useId()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  // Basic client-side email check for fast feedback before the round-trip
  function isValidEmail(value: string): boolean {
    return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(value)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim() ?? ''
    const honeypot =
      (form.elements.namedItem('website') as HTMLInputElement)?.value?.trim() ?? ''

    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: honeypot }),
      })
      const data: { success?: boolean; error?: string } = await res.json()

      if (data.success) {
        setStatus('success')
        setMessage("You're subscribed! Welcome to the NAVCOM mailing list.")
        formRef.current?.reset()
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please check your connection and try again.')
    }
  }

  function handleEmailChange() {
    if (status === 'error') {
      setStatus('idle')
      setMessage('')
    }
  }

  const isSubmitting = status === 'submitting'

  return (
    <div className="pb-10 mb-10 border-b border-blue-800">
      <div className="max-w-xl">
        <h3 className="text-lg font-bold text-white mb-1">Stay in the Loop</h3>
        <p className="text-sm text-gray-300 mb-4" id={`${inputId}-desc`}>
          Receive the NAVCOM newsletter and chapter announcements each month.
          No spam — just aviation.
        </p>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          aria-label="Mailing list signup"
        >
          {/*
           * Honeypot field — hidden from real users; bots fill it in.
           * Positioned off-screen rather than display:none so assistive tech
           * won't inadvertently announce it. tabIndex={-1} prevents keyboard reach.
           */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}
          >
            <label htmlFor={`${inputId}-hp`}>Leave this field empty</label>
            <input
              id={`${inputId}-hp`}
              type="text"
              name="website"
              tabIndex={-1}
              defaultValue=""
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              {/* Visually hidden label satisfies WCAG 1.3.1 / 2.5.3 */}
              <label htmlFor={inputId} className="sr-only">
                Email address
              </label>
              <input
                id={inputId}
                type="email"
                name="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={status === 'error' ? 'true' : 'false'}
                aria-describedby={`${inputId}-desc${message ? ` ${statusId}` : ''}`}
                placeholder="you@example.com"
                disabled={isSubmitting || status === 'success'}
                onChange={handleEmailChange}
                className={[
                  'w-full rounded-lg px-4 py-2.5 text-sm text-eaa-blue bg-white',
                  'placeholder:text-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-eaa-yellow',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  status === 'error' ? 'ring-2 ring-red-400' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || status === 'success'}
              aria-disabled={isSubmitting || status === 'success'}
              className={[
                'bg-eaa-yellow text-eaa-blue px-6 py-2.5 rounded-lg font-bold text-sm',
                'hover:bg-yellow-400 transition-colors whitespace-nowrap',
                'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-eaa-blue',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  {/* Simple spinner — purely decorative */}
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Subscribing…
                </span>
              ) : status === 'success' ? (
                'Subscribed!'
              ) : (
                'Subscribe'
              )}
            </button>
          </div>

          {/*
           * Live region — role="status" for success (polite), role="alert" for
           * errors (assertive). This satisfies WCAG 4.1.3 Status Messages.
           */}
          {message && (
            <p
              id={statusId}
              role={status === 'error' ? 'alert' : 'status'}
              aria-live={status === 'error' ? 'assertive' : 'polite'}
              className={[
                'mt-3 text-sm font-medium',
                status === 'error' ? 'text-red-300' : 'text-green-300',
              ].join(' ')}
            >
              {/* Non-color indicator for WCAG 1.4.1 */}
              {status === 'error' ? '⚠ ' : '✓ '}
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
