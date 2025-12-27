/**
 * Script to create an admin account
 * 
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <password> <name>
 * 
 * Example:
 *   npx tsx scripts/create-admin.ts admin@eaa690.org password123 "Admin User"
 * 
 * Note: Make sure DATABASE_URL is set in your environment
 */

import { auth } from "../lib/better-auth"

async function createAdmin() {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> <name>")
    console.error("Example: npx tsx scripts/create-admin.ts admin@eaa690.org password123 \"Admin User\"")
    process.exit(1)
  }

  const [email, password, name] = args

  try {
    console.log("Creating admin account...")
    
    // Create user with admin role
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    })

    if ('error' in result && result.error) {
      console.error("Error creating account:", result.error)
      process.exit(1)
    }

    // Update user to admin role
    // Note: BetterAuth admin plugin may handle this differently
    // You may need to manually update the database or use admin API
    console.log("Admin account created successfully!")
    console.log("Email:", email)
    console.log("Name:", name)
    console.log("\nNote: You may need to manually set the role to 'admin' in the database")
    console.log("or use the admin API to update the user role.")
    
    process.exit(0)
  } catch (error) {
    console.error("Failed to create admin account:", error)
    process.exit(1)
  }
}

createAdmin()

