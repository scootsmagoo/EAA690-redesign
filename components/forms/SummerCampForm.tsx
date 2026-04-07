'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'

// W6: border-gray-500 (~4.25:1 on white) meets the 3:1 minimum for UI component boundaries (WCAG 1.4.11)
const INPUT = 'w-full border border-gray-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eaa-blue focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'
const FIELD = 'mb-5'
const FIELDSET = 'mb-5 border-0 m-0 p-0'

export default function SummerCampForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  // W4: Move focus to success message so keyboard/AT users aren't stranded
  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const fd = new FormData(form)

    const data: Record<string, string> = {}
    fd.forEach((value, key) => { data[key] = value.toString() })

    try {
      const res = await fetch('/api/forms/summer_camp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('success')
      form.reset()
    } catch (err) {
      console.error(err)
      setErrorMsg('Something went wrong. Please try again or email us directly.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      // W3: role="status" announces to AT without interrupting; tabIndex={-1} allows programmatic focus
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="bg-green-50 border border-green-200 rounded-xl p-8 text-center focus:outline-none"
      >
        <div className="text-4xl mb-3" aria-hidden="true">✅</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Waitlist Request Received!</h3>
        <p className="text-green-700 text-sm">
          We&apos;ve received your request and will be in touch as spots become available.
          Chapter members receive priority — make sure your membership is current.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={status === 'submitting'} noValidate>
      <p className="text-xs text-gray-500 mb-5">
        Fields marked <span aria-hidden="true">*</span><span className="sr-only">with an asterisk</span> are required.
      </p>

      {/* O2/O3: Honeypot — hidden from humans and AT; bots that fill all fields will trigger rejection */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: 0, height: 0, overflow: 'hidden' }}>
        <label htmlFor="sc_website">Website</label>
        <input id="sc_website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <h3 className="text-lg font-bold text-eaa-blue mb-4">Camper Information</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className={FIELD}>
          <label htmlFor="sc_first" className={LABEL}>First Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sc_first" name="camper_first_name" type="text" required autoComplete="given-name" className={INPUT} />
        </div>
        <div className={FIELD}>
          <label htmlFor="sc_last" className={LABEL}>Last Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sc_last" name="camper_last_name" type="text" required autoComplete="family-name" className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={FIELD}>
          <label htmlFor="sc_dob" className={LABEL}>Date of Birth <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sc_dob" name="camper_dob" type="date" required className={INPUT} />
        </div>
        <div className={FIELD}>
          <label htmlFor="sc_grade" className={LABEL}>Grade in Fall 2026 <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <select id="sc_grade" name="grade" required className={INPUT}>
            <option value="">Select grade…</option>
            {['7th', '8th', '9th', '10th', '11th', '12th'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={FIELD}>
        <label htmlFor="sc_group" className={LABEL}>
          Group Preference <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
        </label>
        {/* W7: aria-describedby links helper text to the select */}
        <select id="sc_group" name="group_preference" required className={INPUT} aria-describedby="sc_group_hint">
          <option value="">Select group…</option>
          <option value="Alpha (Ages 12–13, $375)">Alpha — Ages 12–13 ($375)</option>
          <option value="Bravo (Ages 14–15, $375)">Bravo — Ages 14–15 ($375)</option>
          <option value="Charlie (Ages 16–18, $575)">Charlie — Ages 16–18 ($575)</option>
        </select>
        <p id="sc_group_hint" className="text-xs text-gray-500 mt-1">
          Alpha and Bravo waitlists are currently full. Charlie Group (ages 16–18) is accepting waitlist requests.
        </p>
      </div>

      <h3 className="text-lg font-bold text-eaa-blue mt-6 mb-4">Parent / Guardian</h3>

      <div className={FIELD}>
        <label htmlFor="sc_parent" className={LABEL}>Parent / Guardian Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
        <input id="sc_parent" name="parent_guardian_name" type="text" required autoComplete="name" className={INPUT} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={FIELD}>
          <label htmlFor="sc_email" className={LABEL}>Email Address <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sc_email" name="parent_email" type="email" required autoComplete="email" className={INPUT} />
        </div>
        <div className={FIELD}>
          <label htmlFor="sc_phone" className={LABEL}>Phone Number <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sc_phone" name="parent_phone" type="tel" required autoComplete="tel" className={INPUT} placeholder="(555) 555-5555" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-eaa-blue mt-6 mb-4">Emergency Contact</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={FIELD}>
          <label htmlFor="sc_ec_name" className={LABEL}>Emergency Contact Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sc_ec_name" name="emergency_contact_name" type="text" required className={INPUT} />
        </div>
        <div className={FIELD}>
          <label htmlFor="sc_ec_phone" className={LABEL}>Emergency Contact Phone <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="sc_ec_phone" name="emergency_contact_phone" type="tel" required className={INPUT} placeholder="(555) 555-5555" />
        </div>
      </div>

      <div className={FIELD}>
        <label htmlFor="sc_medical" className={LABEL}>Medical Notes / Allergies</label>
        <textarea
          id="sc_medical"
          name="medical_notes"
          rows={3}
          className={INPUT}
          placeholder="List any allergies, medications, or medical conditions we should know about…"
        />
      </div>

      <div className={FIELD}>
        <label htmlFor="sc_heard" className={LABEL}>How did you hear about us?</label>
        <input id="sc_heard" name="heard_from" type="text" className={INPUT} placeholder="Friend, school, website…" />
      </div>

      {/* W3: role="alert" causes immediate announcement by screen readers when error appears */}
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
        {status === 'submitting' ? 'Submitting…' : 'Submit Waitlist Request'}
      </button>
    </form>
  )
}
