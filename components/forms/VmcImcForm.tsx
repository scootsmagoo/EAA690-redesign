'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'

const INPUT = 'w-full border border-gray-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eaa-blue focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'
const FIELD = 'mb-5'
const FIELDSET = 'mb-5 border-0 m-0 p-0'

export default function VmcImcForm() {
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
      const res = await fetch('/api/forms/vmc_imc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('success')
      e.currentTarget.reset()
    } catch (err) {
      console.error(err)
      setErrorMsg('Something went wrong. Please try again or email Chris Serra directly.')
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
        <h3 className="text-xl font-bold text-green-800 mb-2">You&apos;re on the list!</h3>
        <p className="text-green-700 text-sm">
          Chris Serra will be in touch before the next meeting (every 3rd Thursday, 7–9 PM).
          All pilots are welcome — no instrument rating required.
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
        <label htmlFor="vmc_website">Website</label>
        <input id="vmc_website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={FIELD}>
        <label htmlFor="vmc_name" className={LABEL}>Full Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
        <input id="vmc_name" name="name" type="text" required autoComplete="name" className={INPUT} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={FIELD}>
          <label htmlFor="vmc_email" className={LABEL}>Email Address <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
          <input id="vmc_email" name="email" type="email" required autoComplete="email" className={INPUT} />
        </div>
        <div className={FIELD}>
          <label htmlFor="vmc_phone" className={LABEL}>Phone Number</label>
          <input id="vmc_phone" name="phone" type="tel" autoComplete="tel" className={INPUT} placeholder="(555) 555-5555" />
        </div>
      </div>

      <div className={FIELD}>
        <label htmlFor="vmc_cert" className={LABEL}>Pilot Certificate Type</label>
        <select id="vmc_cert" name="certificate_type" className={INPUT}>
          <option value="">Select…</option>
          <option value="None / Not a pilot">None / Not a pilot</option>
          <option value="Student Pilot">Student Pilot</option>
          <option value="Sport Pilot">Sport Pilot</option>
          <option value="Private Pilot">Private Pilot</option>
          <option value="Commercial Pilot">Commercial Pilot</option>
          <option value="ATP">ATP</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* W1: fieldset/legend for radio groups */}
      <fieldset className={FIELDSET}>
        <legend className={LABEL}>Are you instrument rated?</legend>
        <div className="flex gap-6 mt-1">
          {['Yes', 'No', 'In progress'].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="instrument_rated" value={opt} className="accent-eaa-blue" />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={FIELDSET}>
        <legend className={LABEL}>Would you be interested in presenting a scenario?</legend>
        <div className="flex gap-6 mt-1">
          {['Yes', 'Maybe', 'No'].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="interested_in_presenting" value={opt} className="accent-eaa-blue" />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={FIELD}>
        <label htmlFor="vmc_heard" className={LABEL}>How did you hear about the VMC/IMC Club?</label>
        <input
          id="vmc_heard"
          name="heard_from"
          type="text"
          className={INPUT}
          placeholder="Friend, chapter newsletter, website…"
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
        {status === 'submitting' ? 'Submitting…' : 'Notify Me of Upcoming Meetings'}
      </button>
    </form>
  )
}
