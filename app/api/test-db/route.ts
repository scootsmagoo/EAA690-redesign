import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

/**
 * Simple database connection test endpoint
 * This will help us diagnose the exact connection issue
 */
export async function GET(request: NextRequest) {
  const dbUrl = process.env.DATABASE_URL
  
  // Show connection string info (without exposing password)
  const urlInfo = dbUrl 
    ? {
        hasUrl: true,
        prefix: dbUrl.substring(0, 50) + '...',
        length: dbUrl.length,
        includesPooler: dbUrl.includes('pooler'),
        includesPostgres: dbUrl.includes('postgres'),
        port: dbUrl.match(/:\d+\//)?.[0] || 'not found',
      }
    : { hasUrl: false }
  
  if (!dbUrl) {
    return NextResponse.json({
      error: 'DATABASE_URL not set',
      urlInfo,
    }, { status: 500 })
  }
  
  let pool: Pool | null = null
  
  try {
    // Create connection pool
    pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes("localhost") 
        ? false 
        : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    })
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version')
    
    // Try to check if user table exists
    let userTableExists = false
    let tableError = null
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user'
        )
      `)
      userTableExists = tableCheck.rows[0]?.exists || false
    } catch (e) {
      tableError = e instanceof Error ? e.message : 'Unknown error'
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      urlInfo,
      database: {
        currentTime: result.rows[0]?.current_time,
        pgVersion: result.rows[0]?.pg_version?.substring(0, 50),
        userTableExists,
        tableError,
      },
    })
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      detail: (error as any)?.detail,
      hint: (error as any)?.hint,
      name: error instanceof Error ? error.name : undefined,
    }
    
    console.error('Database connection test failed:', errorDetails)
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      urlInfo,
      errorDetails,
    }, { status: 500 })
  } finally {
    if (pool) {
      await pool.end().catch(console.error)
    }
  }
}

