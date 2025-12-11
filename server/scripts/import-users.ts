#!/usr/bin/env tsx

/**
 * Production User Import Script
 * 
 * Imports users from CSV file in /opt/crearis/data/import/ directory
 * 
 * Usage:
 *   tsx server/scripts/import-users.ts
 * 
 * Features:
 * - Processes import-users.csv from data/import/ directory
 * - Generates random passwords for new users
 * - Appends passwords to PASSWORDS.csv
 * - Renames processed file with date prefix
 * - Validates CSV data before import
 * - Creates partners if needed (for instructor/location/participant roles)
 * - Uses ON CONFLICT DO NOTHING for idempotency
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { DatabaseAdapter } from '../database/adapter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
const envPath = path.resolve(__dirname, '../../.env')
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    console.log('✅ Loaded environment variables from .env\n')
} else {
    console.error('⚠️  Warning: .env file not found, using environment variables\n')
}

// Configuration constants
const IMPORT_FILENAME = 'import-users.csv'

interface ImportStats {
    totalRows: number
    newUsers: number
    skippedExisting: number
    newPasswords: number
    reusedPasswords: number
    errors: string[]
}

async function main() {
    console.log('\n🚀 User Import Script')
    console.log('='.repeat(70))
    console.log(`Date: ${new Date().toISOString()}`)
    console.log('='.repeat(70))

    // Import dependencies dynamically after env is loaded
    const { getDataPath } = await import('../settings.js')
    const { db: database } = await import('../database/db-new.js')
    const {
        parseCSV,
        loadExistingPasswords,
        savePasswords,
        processUserPassword,
        processUserPartner,
        importUser,
        validateUserRow
    } = await import('../utils/user-import-utils.js')

    // Set configuration paths
    const dataPath = getDataPath()
    const IMPORT_DIR = path.join(dataPath, 'import')
    const ARCHIVE_DIR = path.join(IMPORT_DIR, 'archive')

    // Check if import directory exists
    if (!fs.existsSync(IMPORT_DIR)) {
        fs.mkdirSync(IMPORT_DIR, { recursive: true, mode: 0o700 })
        console.log(`\n✅ Created import directory: ${IMPORT_DIR}`)
    }

    // Check if archive directory exists
    if (!fs.existsSync(ARCHIVE_DIR)) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true, mode: 0o700 })
        console.log(`✅ Created archive directory: ${ARCHIVE_DIR}`)
    }

    // Check if import file exists
    const importFilePath = path.join(IMPORT_DIR, IMPORT_FILENAME)
    if (!fs.existsSync(importFilePath)) {
        console.error(`\n❌ Import file not found: ${importFilePath}`)
        console.log('\n📝 To import users:')
        console.log(`   1. Create file: ${importFilePath}`)
        console.log('   2. Add CSV data with headers: sysmail,extmail,username,password,role,lang,partner_xmlid')
        console.log('   3. Run this script again')
        console.log('\n💡 Example CSV:')
        console.log('   sysmail,extmail,username,password,role,lang,partner_xmlid')
        console.log('   "john.doe@example.com","","John Doe","","user","de",""')
        console.log('   "jane.smith@example.com","jane@company.com","Jane Smith","","user","en","project.partner.jane_smith"')
        process.exit(1)
    }

    console.log(`\n📄 Found import file: ${IMPORT_FILENAME}`)

    // Read and parse CSV
    let csvContent: string
    try {
        csvContent = fs.readFileSync(importFilePath, 'utf-8')
    } catch (error) {
        console.error(`\n❌ Error reading import file: ${error}`)
        process.exit(1)
    }

    const users = parseCSV(csvContent)
    console.log(`   Parsed ${users.length} user records`)

    if (users.length === 0) {
        console.error('\n❌ No user records found in CSV file')
        process.exit(1)
    }

    // Validate CSV data
    console.log('\n🔍 Validating CSV data...')
    const validationErrors: string[] = []
    users.forEach((user, index) => {
        const errors = validateUserRow(user, index + 2) // +2 for header row and 0-based index
        validationErrors.push(...errors)
    })

    if (validationErrors.length > 0) {
        console.error('\n❌ Validation errors found:')
        validationErrors.forEach(error => console.error(`   ${error}`))
        process.exit(1)
    }
    console.log('   ✅ All records valid')

    // Connect to database
    console.log('\n🔌 Connecting to database...')
    console.log(`   ✅ Connected (${database.type})`)

    // Load existing passwords
    console.log('\n🔐 Loading existing passwords...')
    const existingPasswords = loadExistingPasswords()
    console.log(`   Found ${existingPasswords.size} existing password entries`)

    // Process users
    console.log('\n👥 Processing users...')
    console.log('-'.repeat(70))

    const stats: ImportStats = {
        totalRows: users.length,
        newUsers: 0,
        skippedExisting: 0,
        newPasswords: 0,
        reusedPasswords: 0,
        errors: []
    }

    const passwordEntries: Array<{ sysmail: string, extmail: string, password: string }> = []

    for (const user of users) {
        try {
            // Process password
            const passwordResult = await processUserPassword(user, existingPasswords, database)

            if (passwordResult.action === 'skipped') {
                console.log(`   ⏭️  Skipping existing user: ${user.sysmail}`)
                stats.skippedExisting++
                continue
            }

            if (passwordResult.action === 'generated') {
                console.log(`   🔑 Generated new password for: ${user.sysmail}`)
                stats.newPasswords++
            } else {
                console.log(`   ♻️  Reusing password for: ${user.sysmail}`)
                stats.reusedPasswords++
            }

            // Add to password entries
            passwordEntries.push(passwordResult.passwordEntry)

            // Process partner
            const partnerXmlId = user['partner_xmlid'] || user['instructor_id/xmlid'] || user.instructor_id
            let partnerId: number | null = null

            if (partnerXmlId && partnerXmlId.trim()) {
                partnerId = await processUserPartner(user, partnerXmlId, database)
                if (partnerId) {
                    console.log(`      ✓ Linked to partner: ${partnerXmlId}`)
                }
            }

            // Import user
            const created = await importUser(user, passwordResult.hashedPassword, partnerId, database)
            if (created) {
                console.log(`   ✅ Created user: ${user.username} (${user.sysmail})`)
                stats.newUsers++
            }

        } catch (error) {
            const errorMsg = `Error processing ${user.sysmail}: ${error}`
            console.error(`   ❌ ${errorMsg}`)
            stats.errors.push(errorMsg)
        }
    }

    // Save passwords to PASSWORDS.csv
    if (passwordEntries.length > 0) {
        console.log('\n💾 Saving passwords to PASSWORDS.csv...')
        try {
            savePasswords(passwordEntries)
            console.log(`   ✅ Updated PASSWORDS.csv (${passwordEntries.length} entries)`)
        } catch (error) {
            console.error(`   ❌ Error saving passwords: ${error}`)
            stats.errors.push(`Error saving passwords: ${error}`)
        }
    }

    // Archive the import file with date prefix
    console.log('\n📦 Archiving import file...')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const archiveFilename = `${timestamp}_${IMPORT_FILENAME}`
    const archiveFilePath = path.join(ARCHIVE_DIR, archiveFilename)

    try {
        fs.renameSync(importFilePath, archiveFilePath)
        console.log(`   ✅ Archived to: ${archiveFilename}`)
    } catch (error) {
        console.error(`   ❌ Error archiving file: ${error}`)
        stats.errors.push(`Error archiving file: ${error}`)
    }

    // Print summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(70))
    console.log(`Total rows processed:     ${stats.totalRows}`)
    console.log(`New users created:        ${stats.newUsers}`)
    console.log(`Existing users skipped:   ${stats.skippedExisting}`)
    console.log(`New passwords generated:  ${stats.newPasswords}`)
    console.log(`Passwords reused:         ${stats.reusedPasswords}`)
    console.log(`Errors:                   ${stats.errors.length}`)

    if (stats.errors.length > 0) {
        console.log('\n❌ Errors encountered:')
        stats.errors.forEach(error => console.log(`   - ${error}`))
    }

    console.log('\n' + '='.repeat(70))

    if (stats.newUsers > 0) {
        console.log('\n⚠️  IMPORTANT: Password Distribution')
        console.log('   New passwords have been added to PASSWORDS.csv')
        console.log(`   Location: ${path.join(getDataPath(), 'PASSWORDS.csv')}`)
        console.log('   Action required:')
        console.log('   1. Securely copy PASSWORDS.csv')
        console.log('   2. Distribute passwords to new users')
        console.log('   3. Instruct users to change passwords on first login')
        console.log('\n   See docs/PASSWORD_SYSTEM.md for details')
    }

    console.log('\n✅ Import complete!\n')

    await database.close()
    process.exit(stats.errors.length > 0 ? 1 : 0)
}

// Run main function
main().catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
})
