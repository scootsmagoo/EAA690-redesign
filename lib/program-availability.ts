export type ProgramFormSlotKey = 'youthAviation' | 'scholarship' | 'summerCamp' | 'vmcImc'

/** Matches `FormType` in `lib/forms-db` — kept here so this module stays client-safe (no `pg`). */
export const FORM_TYPE_TO_PROGRAM_KEY = {
  youth_aviation: 'youthAviation',
  scholarship: 'scholarship',
  summer_camp: 'summerCamp',
  vmc_imc: 'vmcImc',
} as const

export type ProgramFormTypeKey = keyof typeof FORM_TYPE_TO_PROGRAM_KEY

export type ProgramFormSlot = {
  registrationOpen: boolean
  documentsVisible: boolean
  closedMessage: string
}

const DEFAULT_SLOT: ProgramFormSlot = {
  registrationOpen: true,
  documentsVisible: true,
  closedMessage: '',
}

type RawSlot = {
  registrationOpen?: boolean
  documentsVisible?: boolean
  closedMessage?: string
}

/** Limit CMS-sourced copy (defense in depth vs oversized payloads / UI overflow). */
export const MAX_PROGRAM_CLOSED_MESSAGE_LENGTH = 2000

function clampClosedMessage(s: string): string {
  const t = s.trim()
  if (t.length <= MAX_PROGRAM_CLOSED_MESSAGE_LENGTH) return t
  return t.slice(0, MAX_PROGRAM_CLOSED_MESSAGE_LENGTH)
}

function normalizeSlot(
  raw: RawSlot | null | undefined,
  options?: { documentsAlwaysVisible?: boolean }
): ProgramFormSlot {
  const documentsAlwaysVisible = options?.documentsAlwaysVisible === true
  const documentsVisible = documentsAlwaysVisible
    ? true
    : raw?.documentsVisible !== false

  return {
    registrationOpen: raw?.registrationOpen !== false,
    documentsVisible,
    closedMessage:
      typeof raw?.closedMessage === 'string' ? clampClosedMessage(raw.closedMessage) : '',
  }
}

/** Normalize Sanity `programForms` (or partial / missing) to a full keyed map with safe defaults. */
export function normalizeProgramForms(raw: unknown): Record<ProgramFormSlotKey, ProgramFormSlot> {
  const p = raw && typeof raw === 'object' ? (raw as Record<string, RawSlot>) : {}
  return {
    youthAviation: normalizeSlot(p.youthAviation),
    scholarship: normalizeSlot(p.scholarship),
    summerCamp: normalizeSlot(p.summerCamp, { documentsAlwaysVisible: true }),
    vmcImc: normalizeSlot(p.vmcImc, { documentsAlwaysVisible: true }),
  }
}

export function getProgramSlotForFormType(
  formType: ProgramFormTypeKey,
  slots: Record<ProgramFormSlotKey, ProgramFormSlot>
): ProgramFormSlot {
  return slots[FORM_TYPE_TO_PROGRAM_KEY[formType]] ?? DEFAULT_SLOT
}

export const DEFAULT_PROGRAM_CLOSED_MESSAGE =
  'This program is not accepting online submissions right now. Please check back later, or contact the chapter if you have questions.'
