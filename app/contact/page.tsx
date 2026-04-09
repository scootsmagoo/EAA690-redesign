'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { formatUsPhoneInput } from '@/lib/us-phone'

const INITIAL = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  website: '',
}

export default function ContactPage() {
  const [formData, setFormData] = useState(INITIAL)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          website: formData.website,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      setFormData(INITIAL)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'phone' ? formatUsPhoneInput(value) : value,
    })
  }

  if (status === 'success') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-eaa-blue mb-8">Contact Us</h1>
        <div
          ref={successRef}
          role="status"
          tabIndex={-1}
          className="max-w-xl bg-green-50 border border-green-200 rounded-xl p-8 focus:outline-none"
        >
          <div className="text-4xl mb-3" aria-hidden="true">
            ✉️
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Message sent</h2>
          <p className="text-green-700 text-sm mb-6">
            Thank you for contacting EAA 690. A volunteer will get back to you as soon as possible.
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="text-eaa-blue font-semibold underline hover:text-eaa-light-blue"
          >
            Send another message
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Contact Us</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-eaa-blue mb-6">Get in Touch</h2>

          <div className="space-y-4 mb-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Location</h3>
              <p className="text-gray-700">
                690 Airport Road<br />
                Hangar 1, Briscoe Field<br />
                Lawrenceville, Ga. 30046
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Phone</h3>
              <p className="text-gray-700">
                <a href="tel:4048572492" className="text-eaa-light-blue hover:underline">
                  (404) 857-2492
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
              <p className="text-gray-700">
                <a href="mailto:info@eaa690.org" className="text-eaa-light-blue hover:underline">
                  info@eaa690.org
                </a>
              </p>
            </div>
          </div>

          <div className="bg-eaa-blue text-white p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Visit Us</h3>
            <p className="mb-4">
              We welcome visitors! Our chapter meets regularly, and we&apos;d love to have you join us. Check our{' '}
              <a href="/calendar" className="text-eaa-yellow hover:underline">
                calendar
              </a>{' '}
              for upcoming events.
            </p>
            <p>
              All transactions are secured through Stripe, which is certified to the highest compliance standards.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-eaa-blue mb-6">Send us a Message</h2>

          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={status === 'submitting'} noValidate>
            {/* Honeypot — leave blank */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: 0, height: 0, overflow: 'hidden' }}>
              <label htmlFor="contact_website">Website</label>
              <input
                id="contact_website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            {status === 'error' && errorMsg ? (
              <div role="alert" className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">
                {errorMsg}
              </div>
            ) : null}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-eaa-blue focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-eaa-blue focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                id="phone"
                name="phone"
                placeholder="555-555-5555"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-eaa-blue focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-eaa-blue focus:border-transparent"
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="membership">Membership</option>
                <option value="programs">Programs</option>
                <option value="events">Events</option>
                <option value="donation">Donation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-eaa-blue focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-eaa-yellow text-eaa-blue px-6 py-3 rounded-md font-bold hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
