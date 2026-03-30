import { NextRequest, NextResponse } from 'next/server'
import { APIError } from 'better-auth'
import { getAuth, ensureBetterAuthSchema } from '@/lib/better-auth'
import { getEffectiveDatabaseUrl, isPostgresUrl } from '@/lib/db-resolver'
import { runSqliteAdminSetup } from '@/lib/admin-setup-sqlite'
import { Pool } from 'pg'

/**
 * Initial Admin Setup API Route
 * 
 * This route allows creating the first admin account without authentication.
 * It should be protected or removed after the first admin is created.
 * 
 * Security: In production, consider adding additional checks like:
 * - IP whitelist
 * - Secret token in headers
 * - Environment variable flag
 */
export async function POST(request: NextRequest) {
  let pool: Pool | null = null
  
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    await ensureBetterAuthSchema()

    const dbUrl = getEffectiveDatabaseUrl()
    if (!dbUrl) {
      return NextResponse.json(
        {
          error:
            'DATABASE_URL is not set. In production, set it to your PostgreSQL connection string. For local development, this should not appear — contact support.',
        },
        { status: 500 }
      )
    }

    if (!isPostgresUrl(dbUrl)) {
      const sqliteResult = await runSqliteAdminSetup({
        email,
        password,
        name,
        dbUrl,
      })
      if ('error' in sqliteResult) {
        return NextResponse.json(
          {
            error: sqliteResult.error,
            ...(sqliteResult.details && { details: sqliteResult.details }),
          },
          { status: sqliteResult.status }
        )
      }
      return NextResponse.json({
        success: true,
        message: 'Admin account created successfully',
        user: sqliteResult.user,
      })
    }

    // PostgreSQL
    pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    })

    // Test database connection
    try {
      await pool.query('SELECT 1')
    } catch (dbError) {
      console.error('Database connection test failed:', dbError)
      return NextResponse.json(
        { error: 'Failed to connect to database', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      )
    }

    try {
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%user%'
      `)
      console.log('Available user tables:', tableCheck.rows)
    } catch (checkError) {
      console.warn('admin setup: could not list tables', checkError)
    }

    /**
     * In-process sign-up (same as Better Auth tests). Avoids server-side fetch to the
     * public URL, which fails on Vercel (deployment protection, wrong baseURL, cold starts).
     */
    let userId: string | null = null

    try {
      const signUpResult = await getAuth().api.signUpEmail({
        body: {
          email: email.toLowerCase(),
          password,
          name,
        },
      })
      const u = signUpResult?.user as { id?: string } | undefined
      if (u?.id) userId = u.id
    } catch (e: unknown) {
      const alreadyExists =
        e instanceof APIError &&
        e.status === 'UNPROCESSABLE_ENTITY' &&
        typeof e.message === 'string' &&
        e.message.toLowerCase().includes('already exists')

      if (alreadyExists) {
        const existingUser = await pool.query<{ id: string }>(
          'SELECT id FROM "user" WHERE email = $1',
          [email.toLowerCase()]
        )
        userId = existingUser.rows[0]?.id ?? null
      }

      if (!userId) {
        if (e instanceof APIError) {
          return NextResponse.json(
            {
              error: e.message || 'Sign-up failed',
              details: e.status,
            },
            { status: e.statusCode ?? 500 }
          )
        }
        throw e
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Could not create user or find existing account' },
        { status: 500 }
      )
    }

    // Update user role to admin in the database
    // BetterAuth admin plugin uses a separate admin table or role column
    console.log('Setting admin role for user:', userId)
    let roleSet = false
    
    try {
      // First, check what columns exist in the user table
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user' 
        AND table_schema = 'public'
      `)
      console.log('User table columns:', columnCheck.rows.map(r => r.column_name))
      
      // Mark email as verified first (required for login)
      const emailVerifiedColumn = columnCheck.rows.find(r => 
        r.column_name === 'email_verified' || r.column_name === 'emailVerified'
      )
      if (emailVerifiedColumn) {
        const columnName = emailVerifiedColumn.column_name
        await pool.query(
          `UPDATE "user" SET "${columnName}" = true WHERE id = $1`,
          [userId]
        )
        console.log('Email verified')
      }
      
      // Better Auth admin plugin might use:
      // 1. A 'role' column in the user table
      // 2. A separate 'admin' table
      // 3. A 'data' JSONB column with role info
      
      // Try updating the role column if it exists
      if (columnCheck.rows.some(r => r.column_name === 'role')) {
        await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', userId])
        roleSet = true
        console.log('Role set via role column')
      }
      
      // Check if there's an admin table
      const adminTableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin'
      `)
      
      if (adminTableCheck.rows.length > 0) {
        // Insert into admin table if it exists
        try {
          await pool.query(
            'INSERT INTO admin (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
            [userId]
          )
          roleSet = true
          console.log('Admin role set via admin table')
        } catch (adminError) {
          console.error('Failed to insert into admin table:', adminError)
        }
      }
      
      // Also try updating the data JSONB column
      if (columnCheck.rows.some(r => r.column_name === 'data')) {
        await pool.query(
          `UPDATE "user" SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{role}', '"admin"') WHERE id = $1`,
          [userId]
        )
        roleSet = true
        console.log('Role set via data column')
      }
      
      // If no role column exists, try creating one and setting it
      if (!roleSet && !columnCheck.rows.some(r => r.column_name === 'role')) {
        try {
          await pool.query('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT')
          await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', userId])
          roleSet = true
          console.log('Role column created and set')
        } catch (alterError) {
          console.error('Failed to create role column:', alterError)
        }
      }
      
      if (!roleSet) {
        console.warn('Could not set role - trying alternative methods')
      }
    } catch (roleError) {
      console.error('Failed to set admin role:', roleError)
      // Continue - user was created, role can be set manually if needed
    }

    // Fetch the final user row (avoid hard-coded columns: role / emailVerified may differ by migration)
    const finalUserResult = await pool.query(
      'SELECT * FROM "user" WHERE id = $1 LIMIT 1',
      [userId]
    )
    const finalUser = finalUserResult.rows[0]

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: finalUser,
    })
  } catch (error) {
    console.error('Admin setup error:', error)
    let errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    const dbHint =
      /tenant or user not found|password authentication failed|could not translate host/i.test(
        errorMessage
      )
        ? ' Check DATABASE_URL / POSTGRES_URL in Vercel: use the exact string from Neon, Supabase, or Vercel Postgres (Supabase user is often postgres.<project-ref>).'
        : ''
    if (dbHint) errorMessage = errorMessage + dbHint
    
    // Log full error details for debugging
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    })
    
    return NextResponse.json(
      { 
        error: 'An error occurred while creating the admin account',
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    )
  } finally {
    // Close database connection if it was created
    if (pool) {
      await pool.end().catch(console.error)
    }
  }
}

