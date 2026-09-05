import { describe, expect, it } from 'vitest'
import { getProgramSlotForFormType, normalizeProgramForms } from '@/lib/program-availability'

describe('normalizeProgramForms', () => {
  it('defaults every program to open with documents visible', () => {
    const slots = normalizeProgramForms(undefined)
    for (const slot of Object.values(slots)) {
      expect(slot).toEqual({ registrationOpen: true, documentsVisible: true, closedMessage: '' })
    }
  })

  it('honors explicit closures and trims the message', () => {
    const slots = normalizeProgramForms({
      scholarship: { registrationOpen: false, closedMessage: '  Applications reopen in January.  ' },
    })
    expect(slots.scholarship.registrationOpen).toBe(false)
    expect(slots.scholarship.closedMessage).toBe('Applications reopen in January.')
    expect(slots.youthAviation.registrationOpen).toBe(true)
  })

  it('caps oversized closed messages from the CMS', () => {
    const slots = normalizeProgramForms({ youthAviation: { closedMessage: 'x'.repeat(5000) } })
    expect(slots.youthAviation.closedMessage).toHaveLength(2000)
  })

  it('keeps documents visible for programs that always show them', () => {
    const slots = normalizeProgramForms({
      summerCamp: { documentsVisible: false },
      youthAviation: { documentsVisible: false },
    })
    expect(slots.summerCamp.documentsVisible).toBe(true)
    expect(slots.youthAviation.documentsVisible).toBe(false)
  })

  it('ignores garbage input', () => {
    expect(normalizeProgramForms('nope').outreach.registrationOpen).toBe(true)
    expect(normalizeProgramForms(42).vmcImc.closedMessage).toBe('')
  })
})

describe('getProgramSlotForFormType', () => {
  it('maps DB form types to CMS slot keys', () => {
    const slots = normalizeProgramForms({ summerCamp: { registrationOpen: false } })
    expect(getProgramSlotForFormType('summer_camp', slots).registrationOpen).toBe(false)
    expect(getProgramSlotForFormType('vmc_imc', slots).registrationOpen).toBe(true)
  })
})
