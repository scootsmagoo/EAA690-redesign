import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/pg-pool'
import { getAuth } from '@/lib/better-auth'

/**
 * Admin-only diagnostic: looks up a single user by email and reports whether
 * they exist and whether they hold admin role.
 *
 * SECURITY: This route was previously unauthenticated and returned the full
 * user row (including hashed credentials columns when present), the list of
 * the 10 most recent users, and the user-table schema. That made it a severe
 * information-disclosure / user-enumeration sink (OWASP A01: Broken Access
 * Control, A02: Cryptographic Failures via password-hash exposure). It is now
 * restricted to authenticated admins and only returns the booleans the admin
 * UI actually needs.
 */
async function requireAdmin(request: NextRequest): Promise<true | NextResponse> {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if ((session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 })
  }
  return true
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

export async function GET(request: NextRequest) {
  const check = await requireAdmin(request)
  if (check !== true) return check

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not configured' },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const rawEmail = searchParams.get('email') ?? ''
  const email = rawEmail.trim().toLowerCase().slice(0, 320)
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid `email` query parameter is required.' }, { status: 400 })
  }

  try {
    const userResult = await getPgPool().query<{ id: string; role: string | null }>(
      'SELECT id, role FROM "user" WHERE email = $1 LIMIT 1',
      [email]
    )
    const row = userResult.rows[0]

    return NextResponse.json({
      email,
      userExists: !!row,
      isAdmin: row?.role === 'admin',
    })
  } catch (error) {
    console.error('admin/check error:', error)
    return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
  }
}
