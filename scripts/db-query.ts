#!/usr/bin/env npx tsx
/**
 * Simple database query utility for development ONLY
 * Uses the same connection config as the app
 * 
 * SECURITY: This script has multiple safeguards to prevent production use:
 * - Refuses to run if NODE_ENV=production
 * - Requires DEV_DB_ACCESS=true in .env
 * - Not exposed as an API endpoint (CLI only)
 * 
 * Usage:
 *   npx tsx scripts/db-query.ts "SELECT * FROM images LIMIT 5"
 *   npx tsx scripts/db-query.ts "SELECT img_wide->>'blur' FROM images WHERE id = 108"
 */

import pg from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const { Pool } = pg

// ============================================
// SECURITY CHECKS - Prevent production usage
// ============================================
function enforceDevEnvironment() {
    // Check 1: Refuse if NODE_ENV is production
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ SECURITY: This script cannot run in production mode.')
        console.error('   NODE_ENV is set to "production"')
        process.exit(1)
    }

    // Check 2: Require explicit dev flag
    if (process.env.DEV_DB_ACCESS !== 'true') {
        console.error('❌ SECURITY: DEV_DB_ACCESS flag not set.')
        console.error('   Add DEV_DB_ACCESS=true to your .env file to enable this script.')
        console.error('   This is a safety measure to prevent accidental production use.')
        process.exit(1)
    }

    // Check 3: Warn if connecting to non-localhost
    const dbHost = process.env.DB_HOST || 'localhost'
    if (dbHost !== 'localhost' && dbHost !== '127.0.0.1') {
        console.warn(`⚠️  WARNING: Connecting to remote host: ${dbHost}`)
        console.warn('   Make sure this is your development database!')
    }
}

async function main() {
    // Run security checks first
    enforceDevEnvironment()

    const query = process.argv[2]

    if (!query) {
        console.error('Usage: npx tsx scripts/db-query.ts "YOUR SQL QUERY"')
        console.error('')
        console.error('Examples:')
        console.error('  npx tsx scripts/db-query.ts "SELECT id, name FROM images LIMIT 5"')
        console.error('  npx tsx scripts/db-query.ts "SELECT img_wide->>\'blur\' FROM images WHERE id = 108"')
        console.error('  npx tsx scripts/db-query.ts "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'images\'"')
        process.exit(1)
    }

    // Use same connection as the app
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'crearis',
        user: process.env.DB_USER || 'crearis',
        password: process.env.DB_PASSWORD,
    })

    try {
        const result = await pool.query(query)

        if (result.rows.length === 0) {
            console.log('(no rows returned)')
        } else {
            // Pretty print as table
            console.table(result.rows)
            console.log(`\n${result.rows.length} row(s)`)
        }
    } catch (error) {
        console.error('Query error:', error instanceof Error ? error.message : error)
        process.exit(1)
    } finally {
        await pool.end()
    }
}

main()
