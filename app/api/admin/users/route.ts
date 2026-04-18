import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getAuth } from '@/lib/better-auth'
import { notifyAdminUserPromoted } from '@/lib/form-notifications'

const VALID_ROLES = ['admin', 'editor', 'user'] as const
type Role = (typeof VALID_ROLES)[number]

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 1,
  })
}

/** Verify the calling session is an admin. */
async function requireAdmin(request: NextRequest): Promise<true | NextResponse> {
  const session = await getAuth().api.getSession({ headers: request.headers })
  const role = (session?.user as any)?.role
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 })
  }
  return true
}

/** GET /api/admin/users — list all users */
export async function GET(request: NextRequest) {
  const check = await requireAdmin(request)
  if (check !== true) return check

  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, "emailVerified", "createdAt"
       FROM "user"
       ORDER BY "createdAt" DESC`
    )
    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Failed to list users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  } finally {
    await pool.end().catch(() => {})
  }
}

/** PATCH /api/admin/users — update a user's role
 *  Body: { userId: string, role: 'admin' | 'editor' | 'user' }
 */
export async function PATCH(request: NextRequest) {
  const check = await requireAdmin(request)
  if (check !== true) return check

  let body: { userId?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, role } = body

  if (!userId || !role) {
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
  }

  if (!VALID_ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 }
    )
  }

  // Prevent the calling admin from demoting themselves
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (session?.user?.id === userId && role !== 'admin') {
    return NextResponse.json(
      { error: "You can't change your own role — ask another admin." },
      { status: 400 }
    )
  }

  const pool = getPool()
  try {
    /**
     * Capture the prior role so we can detect a *new* admin promotion
     * (vs. re-applying admin to someone who already had it). Only the
     * promotion transition triggers a security alert.
     */
    const priorResult = await pool.query<{ role: string | null }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [userId]
    )
    if (priorResult.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const priorRole = priorResult.rows[0]?.role ?? 'user'

    const result = await pool.query(
      `UPDATE "user" SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, userId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (role === 'admin' && priorRole !== 'admin') {
      const promotedUser = result.rows[0] as {
        id: string
        name: string | null
        email: string
      }
      const actor = session?.user as
        | { id?: string; name?: string | null; email?: string }
        | undefined
      void notifyAdminUserPromoted({
        promotedUser: {
          id: promotedUser.id,
          email: promotedUser.email,
          name: promotedUser.name,
        },
        promotedBy: {
          id: actor?.id ?? 'unknown',
          email: actor?.email ?? 'unknown',
          name: actor?.name ?? null,
        },
      }).catch((err) => {
        console.error('notifyAdminUserPromoted failed:', err)
      })
    }

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error) {
    console.error('Failed to update role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  } finally {
    await pool.end().catch(() => {})
  }
}
