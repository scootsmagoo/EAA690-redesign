import { describe, expect, it } from 'vitest'
import { validateProgramFormPayload } from '@/lib/program-form-validate'

const validOutreach = {
  organization: 'Gwinnett Scouts',
  contact_first_name: 'Pat',
  contact_last_name: 'Lee',
  email: 'pat@example.org',
  phone: '404-555-1234',
  event_date: 'June 5',
  event_location: 'Briscoe Field',
  expected_attendance: '40',
}

const validYouth = {
  applying_for: 'my_child',
  youth_name: 'Sam',
  youth_age: 12,
  contact_email: 'parent@example.org',
  contact_phone: '404-555-1234',
  guardian_name: 'Chris',
}

describe('validateProgramFormPayload', () => {
  it('accepts a complete outreach request', () => {
    expect(validateProgramFormPayload('outreach', validOutreach)).toBeNull()
  })

  it('rejects malformed email addresses', () => {
    expect(validateProgramFormPayload('outreach', { ...validOutreach, email: 'not-an-email' })).toBe(
      'Invalid submission'
    )
  })

  it('rejects non-positive or absurd attendance counts', () => {
    expect(validateProgramFormPayload('outreach', { ...validOutreach, expected_attendance: '0' })).not.toBeNull()
    expect(validateProgramFormPayload('outreach', { ...validOutreach, expected_attendance: '-5' })).not.toBeNull()
    expect(validateProgramFormPayload('outreach', { ...validOutreach, expected_attendance: '12345678' })).not.toBeNull()
    expect(validateProgramFormPayload('outreach', { ...validOutreach, expected_attendance: 250 })).toBeNull()
  })

  it('requires a guardian name only when applying for a child', () => {
    expect(validateProgramFormPayload('youth_aviation', validYouth)).toBeNull()
    expect(validateProgramFormPayload('youth_aviation', { ...validYouth, guardian_name: '' })).not.toBeNull()
    expect(
      validateProgramFormPayload('youth_aviation', { ...validYouth, applying_for: 'myself', guardian_name: '' })
    ).toBeNull()
  })

  it('enforces maximum lengths on free-text fields', () => {
    expect(
      validateProgramFormPayload('youth_aviation', { ...validYouth, notes: 'x'.repeat(8001) })
    ).not.toBeNull()
    expect(validateProgramFormPayload('youth_aviation', { ...validYouth, notes: 'x'.repeat(8000) })).toBeNull()
  })

  it('treats whitespace-only required fields as missing', () => {
    expect(validateProgramFormPayload('vmc_imc', { name: '   ', email: 'a@b.co' })).not.toBeNull()
    expect(validateProgramFormPayload('vmc_imc', { name: 'Ann', email: 'a@b.co' })).toBeNull()
  })

  it('rejects unknown form types', () => {
    expect(validateProgramFormPayload('bogus' as never, {})).toBe('Invalid submission')
  })
})
