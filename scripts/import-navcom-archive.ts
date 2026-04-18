/**
 * Import NAVCOM newsletter issues into Sanity.
 *
 * Two modes (combine as needed):
 *
 *   1. --manifest <path>   Pull issues from a JSON manifest you maintain in
 *                          the repo (default: scripts/navcom-archive-manifest.json).
 *                          Recommended baseline — works with zero Drive API setup.
 *
 *   2. --drive             Crawl the public NAVCOM Drive folder via the
 *                          Google Drive API. Requires either:
 *                            GOOGLE_API_KEY     (public-folder read access), or
 *                            GOOGLE_DRIVE_TOKEN (OAuth/service-account bearer token).
 *                          Useful when seeding the full archive (1980 → today).
 *
 * Both modes converge on the same `upsertIssue` function which is idempotent —
 * re-running the script will not duplicate issues. We dedupe by:
 *   - Existing slug   (e.g. "april-2026"), then
 *   - Existing pdfUrl (so an issue with a different title but the same Drive
 *     URL is recognised as the same physical issue).
 *
 * Usage:
 *   npx tsx scripts/import-navcom-archive.ts --manifest                 (defaults to ./scripts/navcom-archive-manifest.json)
 *   npx tsx scripts/import-navcom-archive.ts --manifest path/to/file.json
 *   npx tsx scripts/import-navcom-archive.ts --drive
 *   npx tsx scripts/import-navcom-archive.ts --drive --folder <folderId>
 *   npx tsx scripts/import-navcom-archive.ts --manifest --drive --dry-run
 *
 * Required env:
 *   SANITY_API_TOKEN              Editor or Editor+ token (write).
 *   NEXT_PUBLIC_SANITY_PROJECT_ID Defaults to "itqpjbjj".
 *   NEXT_PUBLIC_SANITY_DATASET    Defaults to "production".
 *
 * Drive-mode env (optional):
 *   GOOGLE_API_KEY                Public folder read.
 *   GOOGLE_DRIVE_TOKEN            OAuth bearer token (overrides API key).
 *   NAVCOM_DRIVE_FOLDER_ID        Defaults to the chapter's published archive root.
 */

import { config } from 'dotenv'
import { createClient } from '@sanity/client'
import path from 'path'
import fs from 'fs'

config({ path: path.join(__dirname, '../.env.local') })

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'itqpjbjj'
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_API_TOKEN

const DEFAULT_MANIFEST = path.join(__dirname, 'navcom-archive-manifest.json')
const DEFAULT_DRIVE_FOLDER =
  process.env.NAVCOM_DRIVE_FOLDER_ID || '1C0g5SKQHN4TLTFfdj_IjPTxkv9VUIZRw'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ManifestIssue = {
  title: string
  issueDate: string // ISO date / datetime
  pdfUrl: string
  slug?: string
  volumeLabel?: string
  excerpt?: string
  pageCount?: number
  featured?: boolean
  /** Slugs of `newsletterSection` documents to tag this issue with. */
  sections?: string[]
}

type Manifest = { issues: ManifestIssue[] }

type ExistingIssue = { _id: string; slug?: { current?: string }; pdfUrl?: string | null }

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const useManifest = argv.includes('--manifest')
const useDrive = argv.includes('--drive')

function readArg(flag: string, fallback?: string): string | undefined {
  const i = argv.indexOf(flag)
  if (i === -1) return fallback
  const next = argv[i + 1]
  return next && !next.startsWith('--') ? next : fallback
}

const manifestPath = readArg('--manifest', DEFAULT_MANIFEST)
const folderId = readArg('--folder', DEFAULT_DRIVE_FOLDER)

if (!useManifest && !useDrive) {
  console.error(
    '❌ Specify at least one source: --manifest [path] and/or --drive [--folder <id>].\n   Run with --help for details.'
  )
  process.exit(1)
}

if (!TOKEN) {
  console.error('❌ SANITY_API_TOKEN is not set in .env.local. An Editor (or higher) token is required.')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(input: string, max = 96): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
}

/**
 * Best-effort extraction of an issue date from a Drive filename.
 * Recognises forms like:
 *   "NAVCOM Apr 2026.pdf"
 *   "April 2026 NAVCOM.pdf"
 *   "2026-04 NAVCOM.pdf"
 *   "NAVCOM-2026-04.pdf"
 *   "NAVCOM 04-2026.pdf"
 * Returns ISO datetime string at the 1st of the month at 12:00 UTC, or null.
 */
function extractIssueDate(name: string): string | null {
  const cleaned = name.replace(/\.[a-z]+$/i, '').replace(/[._]/g, ' ')

  // YYYY-MM or YYYY/MM
  let m = cleaned.match(/(20\d{2}|19\d{2})[\s\-\/](0?[1-9]|1[0-2])\b/)
  if (m) return mkIso(parseInt(m[1], 10), parseInt(m[2], 10))

  // MM-YYYY
  m = cleaned.match(/\b(0?[1-9]|1[0-2])[\s\-\/](20\d{2}|19\d{2})\b/)
  if (m) return mkIso(parseInt(m[2], 10), parseInt(m[1], 10))

  // "Month YYYY" or "Mon YYYY"
  const monthRe = new RegExp(`\\b(${Object.keys(MONTHS).join('|')})\\b[\\s\\-]*\\b(20\\d{2}|19\\d{2})\\b`, 'i')
  m = cleaned.match(monthRe)
  if (m) {
    const month = MONTHS[m[1].toLowerCase()]
    if (month) return mkIso(parseInt(m[2], 10), month)
  }

  // "YYYY Month"
  const yearMonthRe = new RegExp(`\\b(20\\d{2}|19\\d{2})\\b[\\s\\-]*\\b(${Object.keys(MONTHS).join('|')})\\b`, 'i')
  m = cleaned.match(yearMonthRe)
  if (m) {
    const month = MONTHS[m[2].toLowerCase()]
    if (month) return mkIso(parseInt(m[1], 10), month)
  }

  return null
}

function mkIso(year: number, month: number): string {
  const mm = month.toString().padStart(2, '0')
  return `${year}-${mm}-01T12:00:00.000Z`
}

function defaultTitle(name: string, iso: string | null): string {
  if (iso) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) {
      return `NAVCOM — ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }
  }
  // Strip common cruft and use the cleaned filename.
  return name.replace(/\.[a-z]+$/i, '').replace(/[_\-]+/g, ' ').trim()
}

// ---------------------------------------------------------------------------
// Sanity helpers (idempotent upsert)
// ---------------------------------------------------------------------------
async function fetchExistingIssues(): Promise<ExistingIssue[]> {
  return client.fetch<ExistingIssue[]>(
    `*[_type == "newsletterIssue"]{ _id, slug, pdfUrl }`
  )
}

async function fetchSectionRefs(): Promise<Map<string, string>> {
  const rows = await client.fetch<{ _id: string; slug?: { current?: string } }[]>(
    `*[_type == "newsletterSection" && defined(slug.current)]{ _id, slug }`
  )
  const map = new Map<string, string>()
  for (const r of rows) {
    if (r.slug?.current) map.set(r.slug.current, r._id)
  }
  return map
}

async function uniqueSlug(base: string, taken: Set<string>): Promise<string> {
  let slug = base || 'navcom-issue'
  if (!taken.has(slug)) {
    taken.add(slug)
    return slug
  }
  let i = 2
  while (taken.has(`${slug}-${i}`)) i++
  const next = `${slug}-${i}`
  taken.add(next)
  return next
}

async function upsertIssue(
  issue: ManifestIssue,
  existing: ExistingIssue[],
  takenSlugs: Set<string>,
  sectionMap: Map<string, string>
): Promise<{ status: 'created' | 'updated' | 'skipped'; id?: string; reason?: string }> {
  const desiredSlug = issue.slug?.trim() || slugify(issue.title) || slugify(`navcom-${issue.issueDate}`)

  // Match by slug first, then by pdfUrl.
  let match = existing.find((e) => e.slug?.current === desiredSlug)
  if (!match && issue.pdfUrl) {
    match = existing.find((e) => (e.pdfUrl ?? '').trim() === issue.pdfUrl.trim())
  }

  const sections =
    issue.sections
      ?.map((s) => sectionMap.get(s))
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ _type: 'reference' as const, _ref: id, _key: id })) ?? []

  if (issue.sections?.length && sections.length !== issue.sections.length) {
    const missing = issue.sections.filter((s) => !sectionMap.has(s))
    console.warn(`   ⚠️  Unknown section slug(s) on "${issue.title}": ${missing.join(', ')} — skipping those refs.`)
  }

  const docFields: Record<string, unknown> = {
    _type: 'newsletterIssue',
    title: issue.title,
    slug: { _type: 'slug', current: match?.slug?.current ?? (await uniqueSlug(desiredSlug, takenSlugs)) },
    issueDate: issue.issueDate,
    pdfUrl: issue.pdfUrl,
  }
  if (issue.volumeLabel) docFields.volumeLabel = issue.volumeLabel
  if (issue.excerpt) docFields.excerpt = issue.excerpt
  if (typeof issue.pageCount === 'number') docFields.pageCount = issue.pageCount
  if (typeof issue.featured === 'boolean') docFields.featured = issue.featured
  if (sections.length > 0) docFields.sections = sections

  if (dryRun) {
    return { status: match ? 'updated' : 'created', reason: 'dry-run' }
  }

  if (match) {
    await client
      .patch(match._id)
      .set({
        title: docFields.title,
        issueDate: docFields.issueDate,
        pdfUrl: docFields.pdfUrl,
        ...(issue.volumeLabel ? { volumeLabel: issue.volumeLabel } : {}),
        ...(issue.excerpt ? { excerpt: issue.excerpt } : {}),
        ...(typeof issue.pageCount === 'number' ? { pageCount: issue.pageCount } : {}),
        ...(typeof issue.featured === 'boolean' ? { featured: issue.featured } : {}),
        ...(sections.length > 0 ? { sections } : {}),
      })
      .commit()
    return { status: 'updated', id: match._id }
  }

  const created = await client.create(docFields as never)
  return { status: 'created', id: created._id }
}

// ---------------------------------------------------------------------------
// Manifest source
// ---------------------------------------------------------------------------
function loadManifest(p: string): Manifest {
  if (!fs.existsSync(p)) {
    console.error(`❌ Manifest not found at ${p}`)
    process.exit(1)
  }
  const raw = fs.readFileSync(p, 'utf8')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error(`❌ Could not parse JSON: ${(err as Error).message}`)
    process.exit(1)
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Manifest).issues)) {
    console.error('❌ Manifest must be an object with an "issues": [...] array.')
    process.exit(1)
  }
  const m = parsed as Manifest
  for (const issue of m.issues) {
    if (!issue.title || !issue.issueDate || !issue.pdfUrl) {
      console.error(`❌ Manifest entry missing required fields: ${JSON.stringify(issue)}`)
      process.exit(1)
    }
  }
  return m
}

// ---------------------------------------------------------------------------
// Drive source (public folder via API key, or any folder via OAuth token)
// ---------------------------------------------------------------------------
type DriveFile = {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  size?: string
}

async function listDriveFolder(folder: string): Promise<DriveFile[]> {
  const apiKey = process.env.GOOGLE_API_KEY?.trim()
  const oauthToken = process.env.GOOGLE_DRIVE_TOKEN?.trim()
  if (!apiKey && !oauthToken) {
    throw new Error(
      'Drive crawl requires GOOGLE_API_KEY (for public folders) or GOOGLE_DRIVE_TOKEN (OAuth / service account).'
    )
  }

  const headers: Record<string, string> = {}
  if (oauthToken) headers.Authorization = `Bearer ${oauthToken}`

  const out: DriveFile[] = []
  let pageToken: string | undefined
  do {
    const params = new URLSearchParams({
      q: `'${folder}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id,name,mimeType,modifiedTime,size)',
      pageSize: '200',
      ...(apiKey && !oauthToken ? { key: apiKey } : {}),
      ...(pageToken ? { pageToken } : {}),
    })
    const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`
    const res = await fetch(url, { headers })
    if (!res.ok) {
      throw new Error(`Drive API ${res.status}: ${await res.text()}`)
    }
    const body = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string }
    if (Array.isArray(body.files)) out.push(...body.files)
    pageToken = body.nextPageToken
  } while (pageToken)

  return out
}

async function crawlDrive(rootFolder: string): Promise<ManifestIssue[]> {
  const collected: ManifestIssue[] = []
  const queue: string[] = [rootFolder]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const folder = queue.shift()!
    if (visited.has(folder)) continue
    visited.add(folder)

    let entries: DriveFile[] = []
    try {
      entries = await listDriveFolder(folder)
    } catch (err) {
      console.warn(`   ⚠️  Skipping folder ${folder}: ${(err as Error).message}`)
      continue
    }

    for (const entry of entries) {
      if (entry.mimeType === 'application/vnd.google-apps.folder') {
        queue.push(entry.id)
        continue
      }
      if (entry.mimeType !== 'application/pdf') continue

      const iso = extractIssueDate(entry.name) || (entry.modifiedTime ?? null)
      if (!iso) {
        console.warn(`   ⚠️  Could not infer date for "${entry.name}" — skipping.`)
        continue
      }
      const title = defaultTitle(entry.name, iso)
      const pdfUrl = `https://drive.google.com/file/d/${entry.id}/view?usp=share_link`
      collected.push({
        title,
        issueDate: iso,
        pdfUrl,
      })
    }
  }
  return collected
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🔗  Project: ${PROJECT_ID} / ${DATASET}`)
  if (dryRun) console.log('🧪  Dry-run — no writes will be made.\n')

  const sourced: ManifestIssue[] = []

  if (useManifest) {
    const m = loadManifest(manifestPath!)
    console.log(`📄  Loaded ${m.issues.length} issue(s) from manifest: ${manifestPath}`)
    sourced.push(...m.issues)
  }

  if (useDrive) {
    if (!folderId) {
      console.error('❌ --drive requires a folder id (default is the chapter\'s archive root).')
      process.exit(1)
    }
    console.log(`☁️   Crawling Drive folder ${folderId}…`)
    const found = await crawlDrive(folderId)
    console.log(`☁️   Discovered ${found.length} PDF(s) in Drive.`)
    sourced.push(...found)
  }

  if (sourced.length === 0) {
    console.log('✨  Nothing to import.')
    return
  }

  // De-dupe within the run by pdfUrl so manifest + drive can be combined safely.
  const seenByPdf = new Set<string>()
  const unique = sourced.filter((i) => {
    const key = i.pdfUrl.trim()
    if (seenByPdf.has(key)) return false
    seenByPdf.add(key)
    return true
  })
  console.log(`🧮  ${unique.length} unique issue(s) after de-dupe.`)

  const [existing, sectionMap] = await Promise.all([fetchExistingIssues(), fetchSectionRefs()])
  const takenSlugs = new Set<string>(
    existing.map((e) => e.slug?.current).filter((s): s is string => Boolean(s))
  )

  let created = 0
  let updated = 0
  for (const issue of unique) {
    try {
      const result = await upsertIssue(issue, existing, takenSlugs, sectionMap)
      if (result.status === 'created') {
        created++
        console.log(`  ✅  Created: ${issue.title}`)
      } else if (result.status === 'updated') {
        updated++
        console.log(`  ♻️   Updated: ${issue.title}`)
      } else {
        console.log(`  ⏭   Skipped: ${issue.title} (${result.reason})`)
      }
    } catch (err) {
      console.error(`  ❌  Failed: ${issue.title} — ${(err as Error).message}`)
    }
  }

  console.log(`\n✅  Done. Created ${created}, updated ${updated}.`)
  if (dryRun) console.log('🧪  Dry-run only — re-run without --dry-run to write changes.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
