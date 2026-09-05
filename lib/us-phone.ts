/**
 * US-only phone helpers: display as xxx-xxx-xxxx while typing and in stored data.
 * Strips a leading country digit 1 when 11 digits are entered.
 */

/** Extract up to 10 US digits; leading 1 (country code) is dropped when present. */
function parseUsPhoneDigits(input: string): string {
  let d = input.replace(/\D/g, '')
  if (d.length >= 11 && d[0] === '1') d = d.slice(1)
  return d.slice(0, 10)
}

/** Format digit string (0–10 digits) as xxx-xxx-xxxx with hyphens as the user types. */
function formatUsPhoneDisplayFromDigits(digits: string): string {
  const d = digits.slice(0, 10)
  const a = d.slice(0, 3)
  const b = d.slice(3, 6)
  const c = d.slice(6, 10)
  if (d.length === 0) return ''
  if (d.length <= 3) return a
  if (d.length <= 6) return `${a}-${b}`
  return `${a}-${b}-${c}`
}

/** Use on each keystroke so pasted or typed numbers become hyphenated. */
export function formatUsPhoneInput(raw: string): string {
  return formatUsPhoneDisplayFromDigits(parseUsPhoneDigits(raw))
}

/** Normalize for persistence (same hyphenated shape whether the client sent digits or symbols). */
export function normalizeUsPhoneForStorage(input: unknown): string {
  if (input === null || input === undefined) return ''
  if (typeof input !== 'string') return ''
  const trimmed = input.trim()
  if (!trimmed) return ''
  return formatUsPhoneDisplayFromDigits(parseUsPhoneDigits(trimmed))
}

/** Keys in program form payloads that hold US phone numbers. */
export const PROGRAM_FORM_PHONE_FIELDS = [
  'parent_phone',
  'emergency_contact_phone',
  'phone',
  'contact_phone',
] as const
