/** Public contact form “topic” values — same order as the /contact form select. */
export const CONTACT_SUBJECT_KEYS = [
  'general',
  'membership',
  'programs',
  'events',
  'donation',
  'other',
] as const

export type ContactSubjectKey = (typeof CONTACT_SUBJECT_KEYS)[number]

const SUBJECT_LABELS: Record<ContactSubjectKey, string> = {
  general: 'General Inquiry',
  membership: 'Membership',
  programs: 'Programs',
  events: 'Events',
  donation: 'Donation',
  other: 'Other',
}

export function getContactSubjectLabel(key: ContactSubjectKey): string {
  return SUBJECT_LABELS[key]
}
