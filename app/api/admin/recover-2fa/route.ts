import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getEffectiveDatabaseUrl } from '@/lib/db-resolver'

/**
 * One-time emergency endpoint to disable 2FA for a user when BETTER_AUTH_SECRET
 * has changed and the stored TOTP secret can no longer be decrypted.
 *
 * Protected by ADMIN_RECOVERY_TOKEN env var — delete that var (or this file)
 * after use.
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get('x-recovery-token')?.trim()
  const expected = process.env.ADMIN_RECOVERY_TOKEN?.trim()

  if (!expected) {
    return NextResponse.json({ error: 'Recovery not configured' }, { status: 404 })
  }
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email required in request body' }, { status: 400 })
  }

  const dbUrl = getEffectiveDatabaseUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'No database URL configured' }, { status: 500 })
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 1,
  })

  try {
    const userResult = await pool.query<{ id: string }>(
      'SELECT id FROM "user" WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Clear 2FA flag on the user row
    await pool.query(
      'UPDATE "user" SET "twoFactorEnabled" = false WHERE id = $1',
      [userId]
    )

    // Remove stored TOTP secret + backup codes
    try {
      await pool.query('DELETE FROM "twoFactor" WHERE "userId" = $1', [userId])
    } catch {
      // Table may not exist or use a different name — safe to ignore
    }

    return NextResponse.json({
      success: true,
      message: `2FA has been disabled for ${email}. Sign in normally, then re-enrol in 2FA from your account settings.`,
    })
  } catch (error) {
    console.error('recover-2fa error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await pool.end().catch(() => {})
  }
}
