'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import UsPhoneInput from '@/components/forms/UsPhoneInput'

const INPUT = 'w-full border border-gray-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eaa-blue focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'
const HINT = 'mt-1 text-xs text-gray-500'
const FIELD = 'mb-5'

export default function OutreachForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [phone, setPhone] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('submitting')
    setErrorMsg('')

    const fd = new FormData(form)
    const data: Record<string, string> = {}
    fd.forEach((value, key) => { data[key] = value.toString() })

    try {
      const res = await fetch('/api/forms/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('success')
      form.reset()
      setPhone('')
    } catch (err) {
      console.error(err)
      setErrorMsg('Something went wrong. Please try again or email the chapter directly.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="bg-green-50 border border-green-200 rounded-xl p-8 text-center focus:outline-none"
      >
        <div className="text-4xl mb-3" aria-hidden="true">✅</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Thank you!</h3>
        <p className="text-green-700 text-sm">
          One of our chapter members will be in touch with you to confirm our participation.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={status === 'submitting'} noValidate>
      <p className="text-xs text-gray-500 mb-5">
        Fields marked <span aria-hidden="true">*</span><span className="sr-only">with an asterisk</span> are required.
      </p>

      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: 0, height: 0, overflow: 'hidden' }}>
        <label htmlFor="outreach_website">Website</label>
        <input id="outreach_website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={FIELD}>
        <label htmlFor="outreach_org" className={LABEL}>
          Organization <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
        </label>
        <input
          id="outreach_org"
          name="organization"
          type="text"
          required
          autoComplete="organization"
          maxLength={200}
          className={INPUT}
        />
      </div>

      {/* W7: Visible per-input labels (not placeholders) so labels remain after typing — WCAG 3.3.2.
         Fieldset+legend groups them under the live site's "Contact Person's Name" heading. */}
      <fieldset className="mb-5 border-0 m-0 p-0">
        <legend className={LABEL}>
          Contact Person&apos;s Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
          <div>
            <label htmlFor="outreach_first_name" className="block text-xs font-medium text-gray-600 mb-1">
              First Name
            </label>
            <input
              id="outreach_first_name"
              name="contact_first_name"
              type="text"
              required
              autoComplete="given-name"
              maxLength={120}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="outreach_last_name" className="block text-xs font-medium text-gray-600 mb-1">
              Last Name
            </label>
            <input
              id="outreach_last_name"
              name="contact_last_name"
              type="text"
              required
              autoComplete="family-name"
              maxLength={120}
              className={INPUT}
            />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={FIELD}>
          <label htmlFor="outreach_email" className={LABEL}>
            Email <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          </label>
          <input
            id="outreach_email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={INPUT}
          />
        </div>
        <div className={FIELD}>
          <label htmlFor="outreach_phone" className={LABEL}>
            Phone <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          </label>
          <UsPhoneInput
            id="outreach_phone"
            name="phone"
            required
            className={INPUT}
            value={phone}
            onValueChange={setPhone}
          />
        </div>
      </div>

      <div className={FIELD}>
        <label htmlFor="outreach_event_date" className={LABEL}>
          Date of Event <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
        </label>
        <input
          id="outreach_event_date"
          name="event_date"
          type="text"
          required
          maxLength={200}
          placeholder="e.g. Saturday, May 17, 2026 — 10:00 AM to 2:00 PM"
          className={INPUT}
          aria-describedby="outreach_event_date_help"
        />
        <p id="outreach_event_date_help" className={HINT}>
          Include start and end times.
        </p>
      </div>

      <div className={FIELD}>
        <label htmlFor="outreach_event_location" className={LABEL}>
          Event Location <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
        </label>
        <input
          id="outreach_event_location"
          name="event_location"
          type="text"
          required
          autoComplete="street-address"
          maxLength={500}
          className={INPUT}
          aria-describedby="outreach_event_location_help"
        />
        <p id="outreach_event_location_help" className={HINT}>
          Full street address, including ZIP code.
        </p>
      </div>

      <div className={FIELD}>
        <label htmlFor="outreach_attendance" className={LABEL}>
          Anticipated Number of Participants <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
        </label>
        {/* W8: step={1} blocks decimals/scientific notation in browser before server rejects them */}
        <input
          id="outreach_attendance"
          name="expected_attendance"
          type="number"
          inputMode="numeric"
          min={1}
          max={9999999}
          step={1}
          required
          title="Whole number, 1 or more"
          className={INPUT}
        />
      </div>

      <div className={FIELD}>
        <label htmlFor="outreach_message" className={LABEL}>Message</label>
        <textarea
          id="outreach_message"
          name="message"
          rows={5}
          maxLength={8000}
          className={INPUT}
        />
      </div>

      <div role="alert" aria-live="assertive">
        {status === 'error' && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">{errorMsg}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        aria-disabled={status === 'submitting'}
        className="w-full bg-eaa-blue text-white py-3 rounded-xl font-bold text-base hover:bg-eaa-light-blue transition-colors disabled:opacity-50 mt-2"
      >
        {status === 'submitting' ? 'Sending…' : 'Send'}
      </button>
    </form>
  )
}
