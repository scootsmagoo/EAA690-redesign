import type { FormType } from '@/lib/forms-db'

/**
 * Display / CSV column order per form — matches the order fields appear in each form component.
 * Unknown keys (future fields) sort to the end alphabetically.
 */
export const SUBMISSION_FIELD_ORDER: Record<FormType, readonly string[]> = {
  summer_camp: [
    'camper_first_name',
    'camper_last_name',
    'camper_dob',
    'grade',
    'group_preference',
    'parent_guardian_name',
    'parent_email',
    'parent_phone',
    'emergency_contact_name',
    'emergency_contact_phone',
    'medical_notes',
    'heard_from',
    'website',
  ],
  scholarship: [
    'applicant_name',
    'dob',
    'email',
    'phone',
    'address',
    'school_grade',
    'scholarship_type',
    'has_soloed',
    'current_certificates',
    'aviation_goals',
    'why_deserving',
    'website',
  ],
  vmc_imc: [
    'name',
    'email',
    'phone',
    'certificate_type',
    'instrument_rated',
    'interested_in_presenting',
    'heard_from',
    'website',
  ],
  youth_aviation: [
    'applying_for',
    'youth_name',
    'youth_age',
    'guardian_name',
    'contact_email',
    'contact_phone',
    'interest_areas',
    'prior_experience',
    'notes',
    'website',
  ],
}

const FORM_SEQUENCE: FormType[] = ['summer_camp', 'scholarship', 'vmc_imc', 'youth_aviation']

function orderKeysForForm(formType: FormType, keys: string[]): string[] {
  const order = SUBMISSION_FIELD_ORDER[formType]
  const have = new Set(keys)
  const out: string[] = []
  for (const k of order) {
    if (have.has(k)) out.push(k)
  }
  const rest = keys.filter((k) => !out.includes(k)).sort((a, b) => a.localeCompare(b))
  return [...out, ...rest]
}

/** When exporting “all” form types, use a stable cross-form ordering then any leftover keys. */
export function orderedKeysForCsvExport(
  formTypeFilter: FormType | null,
  allKeys: Iterable<string>
): string[] {
  const keys = Array.from(new Set(allKeys))
  if (formTypeFilter) {
    return orderKeysForForm(formTypeFilter, keys)
  }
  const have = new Set(keys)
  const out: string[] = []
  for (const ft of FORM_SEQUENCE) {
    for (const k of SUBMISSION_FIELD_ORDER[ft]) {
      if (have.has(k) && !out.includes(k)) out.push(k)
    }
  }
  const rest = keys.filter((k) => !out.includes(k)).sort((a, b) => a.localeCompare(b))
  return [...out, ...rest]
}

/** Key/value pairs in display order for the admin detail table. */
export function orderedSubmissionEntries(
  formType: FormType,
  data: Record<string, unknown>
): [string, unknown][] {
  const keys = orderKeysForForm(formType, Object.keys(data))
  return keys.map((k) => [k, data[k]])
}

/** Human-readable column labels for known keys; falls back to Title Case. */
const LABEL_OVERRIDES: Record<string, string> = {
  camper_first_name: 'Camper first name',
  camper_last_name: 'Camper last name',
  camper_dob: 'Camper date of birth',
  parent_guardian_name: 'Parent / guardian name',
  parent_email: 'Parent email',
  parent_phone: 'Parent phone',
  emergency_contact_name: 'Emergency contact name',
  emergency_contact_phone: 'Emergency contact phone',
  medical_notes: 'Medical notes / allergies',
  heard_from: 'How did you hear about us?',
  group_preference: 'Group preference',
  applicant_name: 'Applicant name',
  dob: 'Date of birth',
  school_grade: 'School / grade',
  scholarship_type: 'Scholarship applying for',
  has_soloed: 'Completed first solo flight?',
  current_certificates: 'Current certificates / ratings',
  aviation_goals: 'Aviation goals',
  why_deserving: 'Why deserving',
  certificate_type: 'Pilot certificate type',
  instrument_rated: 'Instrument rated?',
  interested_in_presenting: 'Interested in presenting?',
  applying_for: 'Applying for',
  youth_name: 'Youth name',
  youth_age: 'Age',
  guardian_name: 'Parent / guardian name',
  contact_email: 'Contact email',
  contact_phone: 'Contact phone',
  interest_areas: 'Areas of interest',
  prior_experience: 'Prior aviation experience',
  notes: 'Additional notes',
  website: 'Website (honeypot)',
}

export function submissionFieldLabel(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key]
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
