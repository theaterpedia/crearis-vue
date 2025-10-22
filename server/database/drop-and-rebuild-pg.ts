#!/usr/bin/env node
/**
 * Drop and Rebuild PostgreSQL Database
 * 
 * This script drops all tables and rebuilds the database from scratch.
 * Requires PostgreSQL superuser credentials or database owner privileges.
 * 
 * Usage:
 *   pnpm db:rebuild
 * 
 * Environment Variables:
 *   - DB_USER: PostgreSQL user (default: from .env)
 *   - DB_PASSWORD: PostgreSQL password (default: from .env)
 *   - DB_NAME: Database name (default: from .env)
 *   - DB_HOST: PostgreSQL host (default: localhost)
 *   - DB_PORT: PostgreSQL port (default: 5432)
 */

import fs from 'fs'
import path from 'path'

// Load .env file from project root BEFORE any other imports
// This ensures environment variables are available when config.ts is loaded
function loadEnvFile(): void {
    const envPath = path.resolve(process.cwd(), '.env')

    if (!fs.existsSync(envPath)) {
        console.log('ℹ️  No .env file found at project root\n')
        return
    }

    try {
        const envContent = fs.readFileSync(envPath, 'utf8')
        const lines = envContent.split('\n')

        for (const line of lines) {
            // Skip comments and empty lines
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue

            // Parse KEY=VALUE format
            const match = trimmed.match(/^([^=]+)=(.*)$/)
            if (!match) continue

            const key = match[1].trim()
            const value = match[2].trim()
                .replace(/^["']|["']$/g, '') // Remove surrounding quotes

            // Only set if not already in environment (env vars take precedence)
            if (!process.env[key]) {
                process.env[key] = value
            }
        }

        console.log('✅ Loaded environment variables from .env\n')
    } catch (error) {
        console.warn('⚠️  Failed to load .env file:', error)
    }
}

// Load environment variables FIRST, before any imports
loadEnvFile()

// Now import modules that depend on environment variables
import pg from 'pg'

const { Pool } = pg

interface DropOptions {
    cascade?: boolean
    verbose?: boolean
}

async function dropAllTables(options: DropOptions = {}): Promise<void> {
    const { cascade = true, verbose = true } = options

    if (verbose) {
        console.log('🗑️  Dropping all tables...\n')
    }

    // Dynamic import to ensure environment is loaded first
    const { getDatabaseConfig } = await import('./config.js')
    const config = getDatabaseConfig()

    if (config.type !== 'postgresql') {
        throw new Error('This script only works with PostgreSQL. Set DATABASE_TYPE=postgresql')
    }

    if (!config.postgresql?.connectionString) {
        throw new Error('PostgreSQL connection string not found')
    }

    const pool = new Pool({
        connectionString: config.postgresql.connectionString,
    })

    try {
        // Get all table names in the public schema
        const result = await pool.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `)

        const tables = result.rows.map(row => row.tablename)

        if (tables.length === 0) {
            if (verbose) {
                console.log('   ℹ️  No tables found in database\n')
            }
            return
        }

        if (verbose) {
            console.log(`   Found ${tables.length} tables:`)
            tables.forEach(table => console.log(`      - ${table}`))
            console.log()
        }

        // Drop all tables
        for (const table of tables) {
            const dropSQL = `DROP TABLE IF EXISTS "${table}" ${cascade ? 'CASCADE' : ''}`

            if (verbose) {
                console.log(`   Dropping table: ${table}`)
            }

            await pool.query(dropSQL)
        }

        if (verbose) {
            console.log(`\n   ✅ Dropped ${tables.length} tables\n`)
        }

    } catch (error) {
        console.error('   ❌ Error dropping tables:', error)
        throw error
    } finally {
        await pool.end()
    }
}

async function dropAndRebuild(): Promise<void> {
    console.log('🔧 PostgreSQL Database: Drop and Rebuild\n')
    console.log('='.repeat(50))
    console.log()

    try {
        // Step 1: Drop all existing tables
        await dropAllTables({ cascade: true, verbose: true })

        // Step 2: Run migrations to rebuild schema
        console.log('🏗️  Rebuilding database schema...\n')

        // Dynamic imports to ensure environment is loaded first
        const { db } = await import('./db-new.js')
        const { runMigrations } = await import('./migrations/index.js')
        const { seedDatabase } = await import('./seed.js')

        const migrationResult = await runMigrations(db, true)
        console.log(`   ✅ Ran ${migrationResult.ran} migrations`)
        console.log()

        // Step 3: Seed database with data
        console.log('🌱 Seeding database...\n')
        await seedDatabase(db)

        console.log()
        console.log('='.repeat(50))
        console.log('✅ Database successfully dropped and rebuilt!\n')

    } catch (error) {
        console.error('\n❌ Failed to drop and rebuild database:')
        console.error(error)
        process.exit(1)
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    dropAndRebuild()
}

export { dropAllTables, dropAndRebuild }
