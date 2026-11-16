import { describe, expect, it } from 'vitest'
import {
  ROSTER_GRACE_DAYS,
  RosterParseError,
  isRosterEntryCurrent,
  parseRosterDate,
  parseRosterExport,
} from '@/lib/member-roster'

// Shaped like the roster.eaachapters.org export (an HTML table saved as .xls).
// All people here are fictional.
const HEADER = [
  'KeyID', 'MemberType', 'NickName', 'FirstName', 'LastName', 'Spouse', 'Email',
  'StreetAddress1', 'CellPhone', 'EAANumber', 'ExpirationDate', 'YouthProtection',
]

function exportHtml(rows: string[][]): string {
  const th = HEADER.map((h) => `<th scope="col">${h}</th>`).join('')
  const trs = rows.map((r) => `\r\n\t\t<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')
  return `<style> .textmode { } </style><div>\r\n\t<table cellspacing="0" rules="all" border="1" id="MainContent_AllMembersGridView">\r\n\t\t<tr style="background-color:White;">${th}</tr>${trs}\r\n\t</table>\r\n</div>`
}

const row = (o: Partial<Record<(typeof HEADER)[number], string>>) => HEADER.map((h) => o[h] ?? '&nbsp;')

describe('parseRosterDate', () => {
  it('reads the export’s US dates, with or without a time', () => {
    expect(parseRosterDate('12/31/2026')).toBe('2026-12-31')
    expect(parseRosterDate('1/5/2027 12:00:00 AM')).toBe('2027-01-05')
    expect(parseRosterDate('2026-03-01')).toBe('2026-03-01')
  })

  it('rejects blanks and impossible dates', () => {
    expect(parseRosterDate('')).toBeNull()
    expect(parseRosterDate('soon')).toBeNull()
    expect(parseRosterDate('2/30/2026')).toBeNull()
  })
})

describe('parseRosterExport', () => {
  it('keeps only the matching columns and normalizes emails', () => {
    const result = parseRosterExport(
      exportHtml([
        row({
          MemberType: 'Regular', FirstName: 'Pat', LastName: 'Example', Email: ' Pat.Example@Example.COM ',
          StreetAddress1: '1 Runway Rd', CellPhone: '555-0100', EAANumber: '1234567', ExpirationDate: '12/31/2026',
          YouthProtection: '1/1/2026',
        }),
      ])
    )
    expect(result.totalRows).toBe(1)
    expect(result.skippedNoEmail).toBe(0)
    expect(result.entries).toEqual([
      {
        email: 'pat.example@example.com',
        firstName: 'Pat',
        lastName: 'Example',
        memberType: 'Regular',
        eaaNumber: '1234567',
        expiresOn: '2026-12-31',
      },
    ])
    // Nothing else from the row survives parsing.
    expect(JSON.stringify(result)).not.toMatch(/Runway|555-0100|Spouse/)
  })

  it('prefers the nickname and decodes HTML entities', () => {
    const { entries } = parseRosterExport(
      exportHtml([row({ NickName: 'Bud', FirstName: 'Robert', LastName: 'O&#39;Hare &amp; Sons', Email: 'bud@example.com', ExpirationDate: '6/1/2027' })])
    )
    expect(entries[0].firstName).toBe('Bud')
    expect(entries[0].lastName).toBe("O'Hare & Sons")
  })

  it('skips rows without a usable email and counts them', () => {
    const result = parseRosterExport(
      exportHtml([
        row({ Email: '&nbsp;', ExpirationDate: '1/1/2027' }),
        row({ Email: 'not-an-email', ExpirationDate: '1/1/2027' }),
        row({ Email: 'ok@example.com', ExpirationDate: '1/1/2027' }),
      ])
    )
    expect(result.totalRows).toBe(3)
    expect(result.skippedNoEmail).toBe(2)
    expect(result.entries.map((e) => e.email)).toEqual(['ok@example.com'])
  })

  it('keeps the later membership when two rows share an email', () => {
    const { entries } = parseRosterExport(
      exportHtml([
        row({ MemberType: 'Student', FirstName: 'Kid', Email: 'family@example.com', ExpirationDate: '3/1/2026' }),
        row({ MemberType: 'Family', FirstName: 'Parent', Email: 'FAMILY@example.com', ExpirationDate: '3/1/2027' }),
      ])
    )
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ memberType: 'Family', expiresOn: '2027-03-01' })
  })

  it('accepts several addresses in one cell', () => {
    const { entries } = parseRosterExport(
      exportHtml([row({ Email: 'a@example.com; b@example.com', ExpirationDate: '1/1/2027' })])
    )
    expect(entries.map((e) => e.email).sort()).toEqual(['a@example.com', 'b@example.com'])
  })

  it('repairs a comma typed in place of the dot before the TLD', () => {
    const { entries } = parseRosterExport(
      exportHtml([
        row({ Email: 'pilot@example,com', ExpirationDate: '1/1/2027' }),
        row({ Email: 'one@example.com,two@example.org', ExpirationDate: '1/1/2027' }),
      ])
    )
    expect(entries.map((e) => e.email).sort()).toEqual([
      'one@example.com',
      'pilot@example.com',
      'two@example.org',
    ])
  })

  it('drops non-numeric EAA numbers', () => {
    const { entries } = parseRosterExport(
      exportHtml([row({ Email: 'x@example.com', EAANumber: 'pending', ExpirationDate: '1/1/2027' })])
    )
    expect(entries[0].eaaNumber).toBeNull()
  })

  it('explains what to upload when the file is not a roster export', () => {
    expect(() => parseRosterExport('just some text')).toThrow(RosterParseError)
    expect(() => parseRosterExport('<table><tr><th>Name</th></tr><tr><td>x</td></tr></table>')).toThrow(
      /Email or ExpirationDate/
    )
  })
})

describe('isRosterEntryCurrent', () => {
  const now = new Date('2026-11-16T12:00:00Z')

  it('accepts future and recently expired memberships', () => {
    expect(isRosterEntryCurrent({ expiresOn: '2027-01-01', memberType: 'Regular' }, now)).toBe(true)
    expect(isRosterEntryCurrent({ expiresOn: '2026-11-15', memberType: 'Family' }, now)).toBe(true)
  })

  it(`uses a ${ROSTER_GRACE_DAYS}-day grace period`, () => {
    // 2026-11-16 minus 90 days is 2026-08-18.
    expect(isRosterEntryCurrent({ expiresOn: '2026-08-18', memberType: 'Regular' }, now)).toBe(true)
    expect(isRosterEntryCurrent({ expiresOn: '2026-08-17', memberType: 'Regular' }, now)).toBe(false)
  })

  it('never approves missing dates or non-members', () => {
    expect(isRosterEntryCurrent({ expiresOn: null, memberType: 'Regular' }, now)).toBe(false)
    expect(isRosterEntryCurrent({ expiresOn: '2027-01-01', memberType: 'Non-Member' }, now)).toBe(false)
  })
})
