/**
 * GET / PUT the signed-in user's display & accessibility preferences.
 *
 * Anonymous visitors do not need this endpoint — their preferences live in
 * localStorage. This route exists so members can sync between devices and
 * keeps zero PII in the payload (theme, motion, contrast, font scale, link
 * underline).
 *
 * Security:
 *   - Auth required: 401 if no session.
 *   - Body is parsed as JSON, then re-validated through `parsePreferences`,
 *     which whitelists keys and coerces to a known enum / boolean shape, so
 *     unexpected fields are dropped silently.
 *   - Body size hard cap (2 KB) before parsing — payload is tiny by design;
 *     larger requests are rejected to defuse parser-DoS edge cases.
 *   - No CSRF token here because the endpoint requires a same-origin Better
 *     Auth session cookie + SameSite=Lax + the existing CSP `form-action 'self'`,
 *     and writes are limited to the caller's own row (UPDATE ... WHERE id =
 *     session.user.id), so cross-site writes can't escalate privilege.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/better-auth'
import { getUserPreferences, setUserPreferences } from '@/lib/user-preferences-db'
import { parsePreferences } from '@/lib/preferences'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 2_048

async function getSessionUser(request: NextRequest) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  return session?.user ? { id: String(session.user.id) } : null
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const prefs = await getUserPreferences(user.id)
    return NextResponse.json(
      { preferences: prefs },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (err) {
    console.error('GET /api/me/preferences:', err)
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Hard size cap before JSON parsing — preferences are ~150 bytes serialized.
  const cl = Number(request.headers.get('content-length') ?? '0')
  if (cl > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const sanitized = parsePreferences(body)
    const saved = await setUserPreferences(user.id, sanitized)
    return NextResponse.json(
      { preferences: saved },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (err) {
    console.error('PUT /api/me/preferences:', err)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
