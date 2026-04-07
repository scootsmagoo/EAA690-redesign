'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'

const INPUT = 'w-full border border-gray-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eaa-blue focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'
const FIELD = 'mb-5'
const FIELDSET = 'mb-5 border-0 m-0 p-0'

const INTEREST_AREAS = [
  { value: 'Aircraft building', label: 'Aircraft building' },
  { value: 'Learning about aviation', label: 'Learning about aviation' },
  { value: 'Flight training interest', label: 'Flight training (eventual goal)' },
  { value: 'Mentoring others', label: 'Becoming a mentor' },
]

export default function YouthAviationForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [applyingFor, setApplyingFor] = useState<'myself' | 'my_child'>('myself')
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    const interests: string[] = fd.getAll('interest_areas').map(String)

    const data: Record<string, unknown> = {}
    fd.forEach((value, key) => {
      if (key !== 'interest_areas') data[key] = value.toString()
    })
    data.interest_areas = interests

    try {
      const res = await fetch('/api/forms/youth_aviation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('success')
      e.currentTarget.reset()
      setApplyingFor('myself')
    } catch (err) {
      console.error(err)
      setErrorMsg('Something went wrong. Please try again or email youth@eaa690.org directly.')
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
        <h3 className="text-xl font-bold text-green-800 mb-2">Interest Received!</h3>
        <p className="text-green-700 text-sm">
          Our youth program leadership will be in touch soon. The program meets every 2nd, 3rd, and 4th
          Saturday from 9 AM to 1 PM and has a capacity of 12 participants.
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
        <label htmlFor="ya_website">Website</label>
        <input id="ya_website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* W1: fieldset/legend for radio group */}
      <fieldset className={FIELDSET}>
        <legend className={LABEL}>
          This application is for… <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
        </legend>
        <div className="flex gap-6 mt-1">
          {[
            { value: 'myself', label: 'Myself' },
            { value: 'my_child', label: 'My child' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="applying_for"
                value={opt.value}
                required
                defaultChecked={opt.value === 'myself'}
                className="accent-eaa-blue"
                onChange={() => setApplyingFor(opt.value as 'myself' | 'my_child')}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={FIELD}>
          <label htmlFor="ya_youth_name" className={LABEL}>
            {applyingFor === 'my_child' ? "Child's Name" : 'Your Name'}{' '}
            <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          </label>
          <input id="ya_youth_name" name="youth_name" type="text" required autoComplete="name" className={INPUT} />
        </div>
        <div className={FIELD}>
          <label htmlFor="ya_age" className={LABEL}>
            {applyingFor === 'my_child' ? "Child's Age" : 'Your Age'}{' '}
            <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          </label>
          <input
            id="ya_age"
            name="youth_age"
            type="number"
            min={14}
            max={25}
            required
            className={INPUT}
            aria-describedby="ya_age_hint"
          />
          <p id="ya_age_hint" className="text-xs text-gray-500 mt-1">Must be 14 or older to participate.</p>
        </div>
      </div>

      {applyingFor === 'my_child' && (
        <div className={FIELD}>
          <label htmlFor="ya_guardian" className={LABEL}>
            Parent / Guardian Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          </label>
          <input id="ya_guardian" name="guardian_name" type="text" required autoComplete="name" className={INPUT} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={FIELD}>
          <label htmlFor="ya_email" className={LABEL}>
            Contact Email <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          </label>
          <input id="ya_email" name="contact_email" type="email" required autoComplete="email" className={INPUT} />
        </div>
        <div className={FIELD}>
          <label htmlFor="ya_phone" className={LABEL}>
            Contact Phone <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          </label>
          <input id="ya_phone" name="contact_phone" type="tel" required autoComplete="tel" className={INPUT} placeholder="(555) 555-5555" />
        </div>
      </div>

      {/* W2: fieldset/legend for checkbox group */}
      <fieldset className={FIELDSET}>
        <legend className={LABEL}>Areas of Interest (select all that apply)</legend>
        <div className="space-y-2 mt-1">
          {INTEREST_AREAS.map((area) => (
            <label key={area.value} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                name="interest_areas"
                value={area.value}
                className="accent-eaa-blue w-4 h-4"
              />
              {area.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={FIELD}>
        <label htmlFor="ya_experience" className={LABEL}>Prior Aviation Experience</label>
        <textarea
          id="ya_experience"
          name="prior_experience"
          rows={3}
          className={INPUT}
          placeholder="Any prior flying, building, or aviation exposure (or 'none' if this is brand new)…"
        />
      </div>

      <div className={FIELD}>
        <label htmlFor="ya_notes" className={LABEL}>Questions or Additional Notes</label>
        <textarea
          id="ya_notes"
          name="notes"
          rows={3}
          className={INPUT}
          placeholder="Anything else we should know…"
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
        {status === 'submitting' ? 'Submitting…' : 'Submit Interest Form'}
      </button>
    </form>
  )
}
