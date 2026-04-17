import type { FormType } from '@/lib/forms-db'

function nonEmpty(s: unknown, max: number): boolean {
  return typeof s === 'string' && s.trim().length > 0 && s.trim().length <= max
}

const EMAIL_MAX = 320
const PHONE_MAX = 40

function okEmail(s: unknown): boolean {
  if (typeof s !== 'string') return false
  const t = s.trim()
  return t.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

/** Server-side shape check before DB insert. Returns error message or null if valid. */
export function validateProgramFormPayload(
  formType: FormType,
  data: Record<string, unknown>
): string | null {
  switch (formType) {
    case 'summer_camp': {
      if (!nonEmpty(data.camper_first_name, 120)) return 'Invalid submission'
      if (!nonEmpty(data.camper_last_name, 120)) return 'Invalid submission'
      if (!nonEmpty(data.camper_dob, 32)) return 'Invalid submission'
      if (!nonEmpty(data.grade, 32)) return 'Invalid submission'
      if (!nonEmpty(data.group_preference, 200)) return 'Invalid submission'
      if (!nonEmpty(data.parent_guardian_name, 200)) return 'Invalid submission'
      if (!okEmail(data.parent_email)) return 'Invalid submission'
      if (!nonEmpty(data.parent_phone, PHONE_MAX)) return 'Invalid submission'
      if (!nonEmpty(data.emergency_contact_name, 200)) return 'Invalid submission'
      if (!nonEmpty(data.emergency_contact_phone, PHONE_MAX)) return 'Invalid submission'
      const med = data.medical_notes
      if (med != null && med !== '' && (typeof med !== 'string' || med.length > 8000)) return 'Invalid submission'
      const heard = data.heard_from
      if (heard != null && heard !== '' && (typeof heard !== 'string' || heard.length > 500)) return 'Invalid submission'
      return null
    }
    case 'scholarship': {
      if (!nonEmpty(data.applicant_name, 200)) return 'Invalid submission'
      if (!nonEmpty(data.dob, 32)) return 'Invalid submission'
      if (!okEmail(data.email)) return 'Invalid submission'
      if (!nonEmpty(data.phone, PHONE_MAX)) return 'Invalid submission'
      if (!nonEmpty(data.address, 2000)) return 'Invalid submission'
      if (!nonEmpty(data.school_grade, 500)) return 'Invalid submission'
      if (!nonEmpty(data.scholarship_type, 120)) return 'Invalid submission'
      if (!nonEmpty(data.has_soloed, 20)) return 'Invalid submission'
      const certs = data.current_certificates
      if (certs != null && certs !== '' && (typeof certs !== 'string' || certs.length > 500)) return 'Invalid submission'
      if (!nonEmpty(data.aviation_goals, 25_000)) return 'Invalid submission'
      if (!nonEmpty(data.why_deserving, 25_000)) return 'Invalid submission'
      return null
    }
    case 'youth_aviation': {
      const af = data.applying_for
      if (af !== 'myself' && af !== 'my_child') return 'Invalid submission'
      if (!nonEmpty(data.youth_name, 200)) return 'Invalid submission'
      const age = data.youth_age
      if (typeof age !== 'string' && typeof age !== 'number') return 'Invalid submission'
      const ageStr = String(age).trim()
      if (!ageStr || ageStr.length > 10) return 'Invalid submission'
      if (!okEmail(data.contact_email)) return 'Invalid submission'
      if (!nonEmpty(data.contact_phone, PHONE_MAX)) return 'Invalid submission'
      if (af === 'my_child' && !nonEmpty(data.guardian_name, 200)) return 'Invalid submission'
      const notes = data.notes
      if (notes != null && notes !== '' && (typeof notes !== 'string' || notes.length > 8000)) return 'Invalid submission'
      return null
    }
    case 'outreach': {
      if (!nonEmpty(data.organization, 200)) return 'Invalid submission'
      if (!nonEmpty(data.contact_first_name, 120)) return 'Invalid submission'
      if (!nonEmpty(data.contact_last_name, 120)) return 'Invalid submission'
      if (!okEmail(data.email)) return 'Invalid submission'
      if (!nonEmpty(data.phone, PHONE_MAX)) return 'Invalid submission'
      if (!nonEmpty(data.event_date, 200)) return 'Invalid submission'
      if (!nonEmpty(data.event_location, 500)) return 'Invalid submission'
      const attendance = data.expected_attendance
      if (typeof attendance !== 'string' && typeof attendance !== 'number') return 'Invalid submission'
      const attStr = String(attendance).trim()
      // Positive whole number, ≤ 7 digits (matches the form's max=9_999_999)
      if (!/^[1-9]\d{0,6}$/.test(attStr)) return 'Invalid submission'
      const message = data.message
      if (message != null && message !== '' && (typeof message !== 'string' || message.length > 8000)) return 'Invalid submission'
      return null
    }
    case 'vmc_imc': {
      if (!nonEmpty(data.name, 200)) return 'Invalid submission'
      if (!okEmail(data.email)) return 'Invalid submission'
      const phone = data.phone
      if (phone != null && phone !== '' && (typeof phone !== 'string' || phone.length > PHONE_MAX)) return 'Invalid submission'
      const heard = data.heard_from
      if (heard != null && heard !== '' && (typeof heard !== 'string' || heard.length > 500)) return 'Invalid submission'
      return null
    }
    default:
      return 'Invalid submission'
  }
}
