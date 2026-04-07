'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'

const INPUT = 'w-full border border-gray-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eaa-blue focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'
const FIELD = 'mb-5'
const FIELDSET = 'mb-5 border-0 m-0 p-0'

export default function ScholarshipForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    fd.forEach((value, key) => { data[key] = value.toString() })

    try {
      const res = await fetch('/api/forms/scholarship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('success')
      e.currentTarget.reset()
    } catch (err) {
      console.error(err)
      setErrorMsg('Something went wrong. Please try again or contact us directly.')
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
        <h3 className="text-xl font-bold text-green-800 mb-2">Application Submitted!</h3>
        <p className="text-green-700 text-sm">
          Your scholarship application has been received. Our scholarship committee reviews all submissions
          and forwards recommendations to the Board of Directors. We&apos;ll be in touch.
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
        <label htmlFor="sch_website">Website</label>
        <input id="sch_website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <h3 className="text-lg font-bold text-eaa-blue mb-4">Personal Information</h3>

      <div className={FIELD}>
        <label htmlFor="sch_name" className={LABEL}>Full Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
        <input id="sch_name" name="applicant_name" type="text" required autoComplete="name" className={INPUT} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={FIELD}>
          <label htmlFor="sch_dob" className={LABEL}>Date of Birth <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sch_dob" name="dob" type="date" required className={INPUT} />
        </div>
        <div className={FIELD}>
          <label htmlFor="sch_email" className={LABEL}>Email Address <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sch_email" name="email" type="email" required autoComplete="email" className={INPUT} />
        </div>
      </div>

      <div className={FIELD}>
        <label htmlFor="sch_phone" className={LABEL}>Phone Number <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
        <input id="sch_phone" name="phone" type="tel" required autoComplete="tel" className={INPUT} placeholder="(555) 555-5555" />
      </div>

      <div className={FIELD}>
        <label htmlFor="sch_address" className={LABEL}>Mailing Address <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
        <textarea
          id="sch_address"
          name="address"
          rows={3}
          required
          autoComplete="street-address"
          className={INPUT}
          placeholder="Street, City, State, ZIP"
        />
      </div>

      <div className={FIELD}>
        <label htmlFor="sch_school" className={LABEL}>School / Grade or Year <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
        <input
          id="sch_school"
          name="school_grade"
          type="text"
          required
          className={INPUT}
          placeholder="e.g. Peachtree Ridge High School, 11th grade"
        />
      </div>

      <h3 className="text-lg font-bold text-eaa-blue mt-6 mb-4">Scholarship Details</h3>

      <div className={FIELD}>
        <label htmlFor="sch_type" className={LABEL}>Scholarship Applying For <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
        <select id="sch_type" name="scholarship_type" required className={INPUT}>
          <option value="">Select…</option>
          <option value="Ray Aviation Scholarship">Ray Aviation Scholarship</option>
          <option value="EAA Chapter 690 Scholarship">EAA Chapter 690 Scholarship</option>
          <option value="Either">Either — committee decides</option>
        </select>
      </div>

      {/* W1: fieldset/legend associates the question with the radio group (WCAG 1.3.1) */}
      <fieldset className={FIELDSET}>
        <legend className={LABEL}>
          Have you completed your first solo flight? <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
        </legend>
        <div className="flex gap-6 mt-1">
          {['Yes', 'No'].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="has_soloed" value={opt} required className="accent-eaa-blue" />
              {opt}
            </label>
          ))}
        </div>
        <p id="sch_solo_hint" className="text-xs text-gray-500 mt-1">
          Note: Flight instruction scholarships require solo completion before an award is made.
        </p>
      </fieldset>

      <div className={FIELD}>
        <label htmlFor="sch_certs" className={LABEL}>Current Certificates / Ratings</label>
        <input
          id="sch_certs"
          name="current_certificates"
          type="text"
          className={INPUT}
          placeholder="e.g. Student Pilot Certificate, none, Private Pilot…"
        />
      </div>

      <h3 className="text-lg font-bold text-eaa-blue mt-6 mb-4">Essays</h3>

      <div className={FIELD}>
        <label htmlFor="sch_goals" className={LABEL}>
          Describe your aviation goals. What do you hope to achieve, and how will this scholarship help?{' '}
          <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          <span className="text-gray-400 font-normal"> (250–500 words)</span>
        </label>
        <textarea
          id="sch_goals"
          name="aviation_goals"
          rows={8}
          required
          className={INPUT}
          placeholder="Tell us about your passion for aviation and your goals…"
        />
      </div>

      <div className={FIELD}>
        <label htmlFor="sch_why" className={LABEL}>
          Why do you deserve this scholarship?{' '}
          <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
          <span className="text-gray-400 font-normal"> (150–300 words)</span>
        </label>
        <textarea
          id="sch_why"
          name="why_deserving"
          rows={5}
          required
          className={INPUT}
          placeholder="Describe your dedication, character, financial need, or other relevant factors…"
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
        {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  )
}
