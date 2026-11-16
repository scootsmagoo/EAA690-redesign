import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/better-auth'
import {
  ROSTER_GRACE_DAYS,
  ROSTER_MAX_BYTES,
  RosterParseError,
  isRosterEntryCurrent,
  parseRosterExport,
} from '@/lib/member-roster'
import { getRosterSummary, replaceMemberRoster } from '@/lib/member-roster-db'
import { autoApproveFromRoster } from '@/lib/roster-auto-approval'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  const role = (session?.user as { role?: string | null } | undefined)?.role
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 }) }
  }
  return { admin: { id: String(session.user.id), email: session.user.email } }
}

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/** Roster status for the admin Registrations page. Counts and dates only, no member data. */
export async function GET(request: NextRequest) {
  const check = await requireAdmin(request)
  if ('error' in check) return check.error
  try {
    const summary = await getRosterSummary()
    return NextResponse.json({ ...summary, graceDays: ROSTER_GRACE_DAYS }, { headers: NO_STORE })
  } catch (error) {
    console.error('Failed to read roster summary:', error)
    return NextResponse.json({ error: 'Failed to read roster status' }, { status: 500 })
  }
}

/**
 * Upload a roster export (multipart field `file`). Replaces the stored roster,
 * then approves any pending, email-verified accounts that now match. The file
 * itself is never written anywhere; only the parsed columns are kept.
 */
export async function POST(request: NextRequest) {
  const check = await requireAdmin(request)
  if ('error' in check) return check.error

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > ROSTER_MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'File is too large.' }, { status: 413 })
  }

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('file')
  } catch {
    return NextResponse.json({ error: 'Expected a file upload.' }, { status: 400 })
  }
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Choose the roster export file to upload.' }, { status: 400 })
  }
  if (file.size > ROSTER_MAX_BYTES) {
    return NextResponse.json({ error: 'File is too large.' }, { status: 413 })
  }

  let parsed
  try {
    parsed = parseRosterExport(await file.text())
  } catch (err) {
    if (err instanceof RosterParseError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }
  if (parsed.entries.length === 0) {
    return NextResponse.json(
      { error: 'No member email addresses were found in that file, so the current roster was kept.' },
      { status: 400 }
    )
  }

  try {
    await replaceMemberRoster(parsed.entries, check.admin.id)
  } catch (error) {
    console.error('Roster import failed:', error)
    return NextResponse.json({ error: 'Roster import failed. The previous roster was kept.' }, { status: 500 })
  }

  let approvedNow = 0
  try {
    approvedNow = await autoApproveFromRoster()
  } catch (error) {
    // Roster is saved; pending accounts are swept again on the next import or verification.
    console.error('Roster auto-approval sweep failed:', error)
  }

  const now = new Date()
  const current = parsed.entries.filter((e) => isRosterEntryCurrent(e, now)).length
  console.info('Member roster imported', {
    by: check.admin.id,
    entries: parsed.entries.length,
    current,
    approvedNow,
  })
  return NextResponse.json(
    {
      success: true,
      totalRows: parsed.totalRows,
      imported: parsed.entries.length,
      skippedNoEmail: parsed.skippedNoEmail,
      current,
      approvedNow,
      graceDays: ROSTER_GRACE_DAYS,
    },
    { headers: NO_STORE }
  )
}
