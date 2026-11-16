/**
 * Chapter member roster: parsing the export from EAA's chapter roster site
 * (roster.eaachapters.org → Search Members → export) and deciding whether a
 * roster entry counts as a current member for automatic account approval.
 *
 * The export is named `.xls` but is really an HTML `<table>`. We keep only the
 * columns needed to match a website signup (email, name, member type, EAA
 * number, expiration). Everything else in the file (addresses, phone numbers,
 * youth-protection dates, ...) is dropped at parse time and never stored.
 *
 * Pure module: no database or Node APIs, so it can be unit-tested directly.
 */

/** Days after a membership's expiration date during which it still counts as current. */
export const ROSTER_GRACE_DAYS = 90

/**
 * Roster member types that never auto-approve. The roster site lists a few
 * contacts (e.g. sponsors or partner-org liaisons) as "Non-Member".
 */
const EXCLUDED_MEMBER_TYPES = new Set(['non-member'])

/** Largest export we accept (bytes). A ~300-member export is about 0.6 MB. */
export const ROSTER_MAX_BYTES = 4 * 1024 * 1024

export type RosterEntry = {
  /** Lower-cased, trimmed. Unique across a parsed roster. */
  email: string
  firstName: string | null
  lastName: string | null
  memberType: string | null
  eaaNumber: string | null
  /** `YYYY-MM-DD`, or null when the export has no parseable date. */
  expiresOn: string | null
}

export type RosterParseResult = {
  entries: RosterEntry[]
  /** Data rows in the file (excluding the header). */
  totalRows: number
  /** Rows with no usable email address. */
  skippedNoEmail: number
}

export class RosterParseError extends Error {}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match
  })
}

function cellText(innerHtml: string): string {
  return decodeEntities(innerHtml.replace(/<[^>]*>/g, ''))
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Rows of cell text from every `<tr>` in an HTML document. */
function htmlTableRows(html: string): string[][] {
  const rows: string[][] = []
  for (const tr of Array.from(html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi))) {
    const cells = Array.from(tr[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]\s*>/gi)).map((m) => cellText(m[1]))
    if (cells.length) rows.push(cells)
  }
  return rows
}

/** `MM/DD/YYYY` (optionally followed by a time) or `YYYY-MM-DD` → `YYYY-MM-DD`. */
export function parseRosterDate(value: string): string | null {
  const v = value.trim()
  let y: number, m: number, d: number
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(v)
  const iso = /^(\d{4})-(\d{2})-(\d{2})\b/.exec(v)
  if (us) {
    ;[m, d, y] = [Number(us[1]), Number(us[2]), Number(us[3])]
  } else if (iso) {
    ;[y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  } else {
    return null
  }
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return date.toISOString().slice(0, 10)
}

function emailsIn(cell: string): string[] {
  return cell
    // Repair a common data-entry typo: "name@domain,com" for "name@domain.com".
    .replace(/(@[a-z0-9-]+),(com|net|org|edu|gov|us)\b/gi, '$1.$2')
    .split(/[\s,;]+/)
    .map(normalizeEmail)
    .filter((e) => e.length <= 254 && EMAIL_RE.test(e))
}

/**
 * Parse a roster export. Throws `RosterParseError` with an admin-readable
 * message when the file isn't a roster export.
 */
export function parseRosterExport(html: string): RosterParseResult {
  const rows = htmlTableRows(html)
  if (rows.length === 0) {
    throw new RosterParseError(
      "This file doesn't contain a table. Upload the export from the EAA chapter roster site (Search Members → export)."
    )
  }

  const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const col = (name: string) => header.indexOf(name)
  const iEmail = col('email')
  const iExpires = col('expirationdate')
  if (iEmail < 0 || iExpires < 0) {
    throw new RosterParseError(
      'The file is missing the Email or ExpirationDate column. Upload the unmodified export from the EAA chapter roster site.'
    )
  }
  const iFirst = col('firstname')
  const iNick = col('nickname')
  const iLast = col('lastname')
  const iType = col('membertype')
  const iEaa = col('eaanumber')

  const byEmail = new Map<string, RosterEntry>()
  let skippedNoEmail = 0
  const dataRows = rows.slice(1)
  const get = (row: string[], i: number) => (i >= 0 && i < row.length && row[i] ? row[i] : null)

  for (const row of dataRows) {
    const emails = emailsIn(get(row, iEmail) ?? '')
    if (emails.length === 0) {
      skippedNoEmail += 1
      continue
    }
    const eaa = get(row, iEaa)
    const base = {
      firstName: get(row, iNick) ?? get(row, iFirst),
      lastName: get(row, iLast),
      memberType: get(row, iType),
      eaaNumber: eaa && /^\d+$/.test(eaa) ? eaa : null,
      expiresOn: parseRosterDate(get(row, iExpires) ?? ''),
    }
    for (const email of emails) {
      const existing = byEmail.get(email)
      // Households and parent/student pairs can share one address: keep the
      // membership that runs latest so the shared address isn't penalised.
      if (!existing || (base.expiresOn ?? '') > (existing.expiresOn ?? '')) {
        byEmail.set(email, { email, ...base })
      }
    }
  }

  return { entries: Array.from(byEmail.values()), totalRows: dataRows.length, skippedNoEmail }
}

/** `YYYY-MM-DD` for a Date, in UTC. */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * True when the entry should auto-approve: a membership type that counts, and
 * an expiration date no more than `graceDays` in the past.
 */
export function isRosterEntryCurrent(
  entry: Pick<RosterEntry, 'expiresOn' | 'memberType'>,
  now: Date = new Date(),
  graceDays: number = ROSTER_GRACE_DAYS
): boolean {
  if (!entry.expiresOn) return false
  if (entry.memberType && EXCLUDED_MEMBER_TYPES.has(entry.memberType.trim().toLowerCase())) return false
  const cutoff = new Date(now.getTime())
  cutoff.setUTCDate(cutoff.getUTCDate() - graceDays)
  return entry.expiresOn >= isoDay(cutoff)
}
