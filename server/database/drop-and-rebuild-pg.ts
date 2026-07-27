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
        // Fresh-replay repair (CV@wsl 2026-07-10): reset the WHOLE public schema, not just
        // tables. The old table-only drop left functions/views/types behind, so a rebuild hit
        // "cannot change return type / input parameter name" when migrations 030/054 re-ran
        // CREATE OR REPLACE FUNCTION with changed signatures. Dropping+recreating the schema is
        // a true reset equivalent to DROP DATABASE, but works without CREATE DATABASE privilege
        // (the reason this script avoided dropping the database). `cascade` is implied.
        void cascade
        if (verbose) {
            console.log('   Resetting public schema (drops all tables, functions, views, types)...')
        }

        await pool.query(`DROP SCHEMA IF EXISTS public CASCADE`)
        await pool.query(`CREATE SCHEMA public`)
        await pool.query(`GRANT ALL ON SCHEMA public TO CURRENT_USER`)
        await pool.query(`GRANT ALL ON SCHEMA public TO PUBLIC`)

        if (verbose) {
            console.log('   ✅ public schema reset (all objects dropped)\n')
        }

    } catch (error) {
        console.error('   ❌ Error resetting schema:', error)
        throw error
    } finally {
        await pool.end()
    }
}

async function dropAndRebuild(): Promise<void> {
    console.log('🔧 PostgreSQL Database: Drop and Rebuild\n')
    console.log('='.repeat(50))
    console.log()

    // SAFETY CHECK: Prevent accidental production database drop
    const nodeEnv = process.env.NODE_ENV
    const dbName = process.env.DB_NAME

    if (nodeEnv === 'production') {
        console.error('\n❌ BLOCKED: Cannot drop database in production environment')
        console.error('   NODE_ENV=production detected')
        console.error('   This command is ONLY for development databases\n')
        console.error('   If you need to reset production:')
        console.error('   1. Create a backup first')
        console.error('   2. Use migration-based schema updates')
        console.error('   3. Never drop production data\n')
        process.exit(1)
    }

    if (dbName && (dbName.includes('prod') || dbName.includes('production'))) {
        console.error('\n❌ BLOCKED: Production database name detected')
        console.error(`   DB_NAME="${dbName}" contains "prod" or "production"`)
        console.error('   This command is ONLY for development databases\n')
        console.error('   To protect production data:')
        console.error('   - Development database: crearis_admin_dev or crearis_dev')
        console.error('   - Production database: crearis_db or crearis_production\n')
        process.exit(1)
    }

    console.log('✅ Environment check passed (development mode)\n')

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
