import { describe, expect, it } from 'vitest'
import { formatUsPhoneInput, normalizeUsPhoneForStorage } from '@/lib/us-phone'

describe('formatUsPhoneInput', () => {
  it('hyphenates progressively as the user types', () => {
    expect(formatUsPhoneInput('')).toBe('')
    expect(formatUsPhoneInput('40')).toBe('40')
    expect(formatUsPhoneInput('4045')).toBe('404-5')
    expect(formatUsPhoneInput('4045551')).toBe('404-555-1')
    expect(formatUsPhoneInput('4045551234')).toBe('404-555-1234')
  })

  it('strips punctuation and a leading country code', () => {
    expect(formatUsPhoneInput('(404) 555-1234')).toBe('404-555-1234')
    expect(formatUsPhoneInput('+1 404 555 1234')).toBe('404-555-1234')
    expect(formatUsPhoneInput('1-404-555-1234')).toBe('404-555-1234')
  })

  it('truncates anything beyond 10 digits', () => {
    expect(formatUsPhoneInput('40455512345678')).toBe('404-555-1234')
  })
})

describe('normalizeUsPhoneForStorage', () => {
  it('returns empty string for non-string or blank input', () => {
    expect(normalizeUsPhoneForStorage(undefined)).toBe('')
    expect(normalizeUsPhoneForStorage(null)).toBe('')
    expect(normalizeUsPhoneForStorage(4045551234)).toBe('')
    expect(normalizeUsPhoneForStorage('   ')).toBe('')
  })

  it('produces the same shape regardless of input formatting', () => {
    expect(normalizeUsPhoneForStorage('4045551234')).toBe('404-555-1234')
    expect(normalizeUsPhoneForStorage(' (404) 555.1234 ')).toBe('404-555-1234')
  })
})
