import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
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

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL environment variable is not set' },
        { status: 500 }
      )
    }

    // Get database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") 
        ? false 
        : { rejectUnauthorized: false },
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

    // Check if any admin users exist
    // First, let's check what tables exist
    try {
      // BetterAuth might use different table names - let's try to find the user table
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%user%'
      `)
      console.log('Available user tables:', tableCheck.rows)
      
      // Try to check admin count (table might be named 'user' or something else)
      const adminCheck = await pool.query(
        "SELECT COUNT(*) as count FROM \"user\" WHERE role = 'admin'"
      )
      const adminCount = parseInt(adminCheck.rows[0]?.count || '0')
      console.log('Admin count:', adminCount)
      
      // Optional: Uncomment to disable after first admin is created
      // if (adminCount > 0) {
      //   return NextResponse.json(
      //     { error: 'Admin setup is disabled. An admin account already exists.' },
      //     { status: 403 }
      //   )
      // }
    } catch (checkError) {
      console.error('Error checking admin count:', checkError)
      // Continue anyway - might be first run or table doesn't exist yet
    }

    // Create user using BetterAuth's signUpEmail API
    console.log('Creating user account...')
    let result
    let userId: string | null = null
    
    try {
      result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      })
    } catch (apiError: any) {
      // Check if user already exists
      if (apiError?.statusCode === 422 && apiError?.body?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
        console.log('User already exists, fetching existing user...')
        // User already exists - fetch them and update their role
        try {
          const existingUser = await pool.query(
            'SELECT id FROM "user" WHERE email = $1',
            [email.toLowerCase()]
          )
          
          if (existingUser.rows.length > 0) {
            userId = existingUser.rows[0].id
            console.log('Found existing user ID:', userId)
            // We'll update the role below
          } else {
            return NextResponse.json(
              { error: 'User exists but could not be found in database' },
              { status: 500 }
            )
          }
        } catch (fetchError) {
          console.error('Failed to fetch existing user:', fetchError)
          return NextResponse.json(
            { error: 'User already exists but could not be retrieved', details: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
            { status: 500 }
          )
        }
      } else {
        // Some other error occurred
        console.error('BetterAuth API error:', apiError)
        console.error('Error type:', typeof apiError)
        console.error('Error details:', JSON.stringify(apiError, Object.getOwnPropertyNames(apiError)))
        
        // Try to get more details from the error
        const errorDetails = apiError instanceof Error 
          ? {
              message: apiError.message,
              name: apiError.name,
              stack: apiError.stack,
              cause: (apiError as any).cause,
            }
          : { raw: apiError }
        
        return NextResponse.json(
          { 
            error: 'Failed to create account via BetterAuth API', 
            details: apiError instanceof Error ? apiError.message : 'Unknown API error',
            errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
          },
          { status: 500 }
        )
      }
    }

    // If we don't have a userId yet (from existing user), get it from the result
    if (!userId && result) {
      // Log the full result to debug the structure
      console.log('Full BetterAuth result:', JSON.stringify(result, null, 2))
      console.log('Result data:', result.data)
      console.log('Result keys:', Object.keys(result))
      
      // BetterAuth's signUpEmail returns { token, user } directly in result.data
      // But when called server-side via auth.api, it might be wrapped differently
      const responseData = result.data || result
      const user = responseData?.user || (result as any)?.user
      
      console.log('Response data:', responseData)
      console.log('User object:', user)
      console.log('User ID:', user?.id)

      // Get the user ID from the created user
      userId = user?.id

      if (!userId) {
        console.error('Could not find user ID in result:', {
          hasData: !!result.data,
          hasResponseData: !!responseData,
          hasUser: !!user,
          dataKeys: result.data ? Object.keys(result.data) : [],
          responseDataKeys: responseData ? Object.keys(responseData) : [],
          resultKeys: Object.keys(result),
          fullResult: result,
        })
        return NextResponse.json(
          { 
            error: 'User created but ID not found',
            debug: process.env.NODE_ENV === 'development' ? {
              resultStructure: result,
              responseData: responseData,
              user: user,
              dataKeys: result.data ? Object.keys(result.data) : [],
              responseDataKeys: responseData ? Object.keys(responseData) : [],
            } : undefined,
          },
          { status: 500 }
        )
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Could not determine user ID' },
        { status: 500 }
      )
    }

    // Update user role to admin in the database
    // BetterAuth admin plugin stores roles differently - let's try multiple approaches
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
      
      // Try updating the role column if it exists
      if (columnCheck.rows.some(r => r.column_name === 'role')) {
        await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', userId])
        roleSet = true
        console.log('Role set via role column')
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
      
      if (!roleSet) {
        console.warn('Could not set role - neither role nor data column found')
      }
    } catch (roleError) {
      console.error('Failed to set admin role:', roleError)
      // Continue - user was created, role can be set manually if needed
    }

    // Also mark email as verified for admin setup
    try {
      await pool.query(
        'UPDATE "user" SET email_verified = true WHERE id = $1',
        [userId]
      )
    } catch (verifyError) {
      console.error('Failed to verify email:', verifyError)
    }

    // Fetch the final user data
    const finalUserResult = await pool.query(
      'SELECT id, email, name, role, "emailVerified" FROM "user" WHERE id = $1',
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
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

