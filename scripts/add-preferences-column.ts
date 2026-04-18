/**
 * Add the `preferences` TEXT column to the user table for cross-device
 * preference sync (theme, accessibility flags). Idempotent.
 *
 * Usage:
 *   npx tsx scripts/add-preferences-column.ts
 *
 * The application also lazily creates this column on first use (see
 * lib/user-preferences-db.ts), so running this script is optional but
 * recommended for production deploys to keep schema drift visible.
 */
import 'dotenv/config'
import { Pool } from 'pg'

async function addColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  })

  try {
    console.log('Connecting to database...')
    await pool.query('SELECT 1')
    console.log('Connected.')

    console.log('Adding "preferences" column to "user" table if missing...')
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS preferences TEXT`)
    console.log('Done.')
  } catch (error) {
    console.error('Failed to add preferences column:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addColumn()
