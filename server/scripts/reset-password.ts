#!/usr/bin/env tsx
/**
 * Password Reset Script
 * 
 * Resets a user's password by their sysmail (email address).
 * Generates a new random password and updates PASSWORDS.csv.
 * 
 * Usage:
 *   tsx server/scripts/reset-password.ts admin@theaterpedia.org
 *   pnpm password:reset admin@theaterpedia.org
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: resolve(__dirname, '../../.env') })
console.log('✅ Loaded environment variables from .env\n')

// Hash password
async function hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs')
    return bcrypt.default.hash(password, 10)
}

// Prompt for confirmation
function promptConfirmation(question: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve) => {
        rl.question(`${question} (yes/no): `, (answer) => {
            rl.close()
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
        })
    })
}

async function resetUserPassword(sysmail: string) {
    console.log('🔐 Password Reset Script')
    console.log('======================================================================')
    console.log(`Date: ${new Date().toISOString()}`)
    console.log('======================================================================\n')

    // Import database and utilities dynamically
    const { db } = await import('../database/db-new.js')
    const { generateRandomPassword, loadExistingPasswords, savePasswords } = await import('../utils/user-import-utils.js')

    try {
        // Connect to database
        console.log('🔌 Connecting to database...')
        console.log(`   ✅ Connected (${db.type})\n`)

        // Find user by sysmail
        console.log(`🔍 Looking up user: ${sysmail}`)
        const user = await db.get('SELECT id, sysmail, extmail, username, role FROM users WHERE sysmail = ?', [sysmail])

        if (!user) {
            console.error(`❌ User not found: ${sysmail}`)
            console.log('\n💡 Tips:')
            console.log('   - Check the email address for typos')
            console.log('   - Verify the user exists in the database')
            process.exit(1)
        }

        console.log(`   ✅ Found user: ${user.username} (${user.sysmail})`)
        console.log(`      Role: ${user.role}`)
        console.log(`      ID: ${user.id}\n`)

        // Confirm reset
        const confirmed = await promptConfirmation(`⚠️  Reset password for ${user.username} (${sysmail})?`)

        if (!confirmed) {
            console.log('\n❌ Password reset cancelled')
            process.exit(0)
        }

        // Generate new password
        console.log('\n🔑 Generating new password...')
        const newPassword = generateRandomPassword()
        console.log(`   Generated: ${newPassword}\n`)

        // Hash password
        console.log('🔐 Hashing password...')
        const hashedPassword = await hashPassword(newPassword)
        console.log('   ✅ Password hashed\n')

        // Update database
        console.log('💾 Updating database...')
        if (db.type === 'postgresql') {
            await db.run(
                'UPDATE users SET password = $1 WHERE sysmail = $2',
                [hashedPassword, sysmail]
            )
        } else {
            await db.run(
                'UPDATE users SET password = ? WHERE sysmail = ?',
                [hashedPassword, sysmail]
            )
        }
        console.log('   ✅ Database updated\n')

        // Update PASSWORDS.csv
        console.log('📝 Updating PASSWORDS.csv...')
        try {
            const existingPasswords = loadExistingPasswords()

            // Create new password entry
            const newEntry = {
                sysmail: sysmail,
                extmail: user.extmail || '',
                password: newPassword
            }

            savePasswords([newEntry])
            console.log('   ✅ Updated PASSWORDS.csv\n')
        } catch (error) {
            console.warn('   ⚠️  Could not update PASSWORDS.csv (file may not exist)')
            console.warn(`      ${error instanceof Error ? error.message : String(error)}\n`)
        }

        // Success summary
        console.log('======================================================================')
        console.log('✅ PASSWORD RESET SUCCESSFUL')
        console.log('======================================================================')
        console.log(`User:     ${user.username}`)
        console.log(`Email:    ${sysmail}`)
        console.log(`Password: ${newPassword}`)
        console.log('======================================================================\n')

        console.log('⚠️  IMPORTANT: Secure Password Delivery')
        console.log('   1. Copy the password above')
        console.log('   2. Send to user via secure channel (encrypted email, etc.)')
        console.log('   3. Instruct user to change password on first login')
        console.log('   4. Consider deleting this from terminal history\n')

    } catch (error) {
        console.error('❌ Error resetting password:', error)
        throw error
    }
}

// Main execution
const sysmail = process.argv[2]

if (!sysmail) {
    console.error('❌ Error: No email address provided\n')
    console.log('Usage:')
    console.log('  tsx server/scripts/reset-password.ts <email>')
    console.log('  pnpm password:reset <email>\n')
    console.log('Examples:')
    console.log('  tsx server/scripts/reset-password.ts admin@theaterpedia.org')
    console.log('  pnpm password:reset john.doe@example.com\n')
    process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(sysmail)) {
    console.error(`❌ Error: Invalid email format: ${sysmail}\n`)
    process.exit(1)
}

// Run password reset
resetUserPassword(sysmail)
    .then(() => {
        console.log('✅ Script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error)
        process.exit(1)
    })
