/**
 * Global Test Setup
 * 
 * Runs once before all tests to prepare the test environment.
 * - Loads environment variables from .env file
 * - Verifies PostgreSQL connection if needed
 * - Creates test database if it doesn't exist
 * - Sets up environment variables
 */

import { config as loadEnv } from 'dotenv'
import { getTestDatabaseConfig } from '../../server/database/test-config.js'

export default async function globalSetup() {
    // Load environment variables from .env file
    loadEnv()

    // Check if we should skip migrations (for pure unit tests)
    const skipMigrations = process.env.SKIP_MIGRATIONS === 'true'

    if (skipMigrations) {
        console.log('\n🧪 Test Environment Setup (Unit Tests)')
        console.log('=========================================')
        console.log('⚡ SKIP_MIGRATIONS=true - skipping database setup')
        console.log('   Tests run in isolation without DB migrations')
        console.log('   This makes unit tests much faster!\n')
        return
    }

    const config = getTestDatabaseConfig()

    console.log('\n🧪 Test Environment Setup')
    console.log('========================')
    console.log(`Database Type: ${config.type}`)

    if (config.type === 'postgresql') {
        console.log(`Database URL: ${config.connectionString}`)
        console.log('\n⚠️  PostgreSQL Integration Tests Enabled')
        console.log('   Running full database rebuild with migrations...\n')

        try {
            const pg = await import('pg')
            const { Pool } = pg.default
            const pool = new Pool({ connectionString: config.connectionString })

            // Verify connection
            await pool.query('SELECT 1')
            console.log('✅ PostgreSQL connection verified')

            // Drop all tables and types for clean slate
            console.log('🗑️  Dropping all tables and types...')
            await dropAllTables(pool)

            // Create required extensions
            console.log('🔧 Creating PostgreSQL extensions...')
            await createExtensions(pool)

            // Run all migrations
            console.log('🔄 Running migrations (000 through 023)...')
            await runTestMigrations(pool)

            console.log('✅ Test database ready with full schema\n')

            await pool.end()
        } catch (error: any) {
            console.error('❌ Test database setup failed:', error.message)
            console.error('   All tests will fail.\n')
            throw error // Stop test execution if setup fails
        }
    } else {
        console.log(`Database: ${config.dbPath}`)
        console.log('✅ SQLite in-memory database will be used\n')
    }
}

/**
 * Create required PostgreSQL extensions
 */
async function createExtensions(pool: any): Promise<void> {
    try {
        // Try to create pgcrypto extension (needed for gen_random_uuid)
        await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
        console.log('   ✅ pgcrypto extension enabled')
    } catch (error: any) {
        // If we can't create it, check if it already exists
        const result = await pool.query(`
            SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
        `)

        if (result.rows.length > 0) {
            console.log('   ✅ pgcrypto extension already exists')
        } else {
            console.error('   ⚠️  Could not create pgcrypto extension')
            console.error('      Run manually: psql -U postgres -d crearis_admin_dev_test -c "CREATE EXTENSION pgcrypto;"')
            throw new Error('pgcrypto extension is required but could not be created')
        }
    }
}

/**
 * Drop all tables and custom types in test database
 */
async function dropAllTables(pool: any): Promise<void> {
    // Drop all tables
    const tablesResult = await pool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    `)

    for (const row of tablesResult.rows) {
        await pool.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`)
    }

    // Drop all custom enum types
    const typesResult = await pool.query(`
        SELECT typname 
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND t.typtype = 'e'
    `)

    for (const row of typesResult.rows) {
        await pool.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`)
    }

    // Drop all composite types
    const compositeResult = await pool.query(`
        SELECT typname 
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND t.typtype = 'c'
    `)

    for (const row of compositeResult.rows) {
        await pool.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`)
    }
}

/**
 * Run all migrations on test database
 */
async function runTestMigrations(pool: any): Promise<void> {
    // Import the database adapter and migration runner
    const { PostgreSQLAdapter } = await import('../../server/database/adapters/postgresql.js')
    const { runMigrations } = await import('../../server/database/migrations/index.js')

    // Create adapter from pool connection string
    const config = getTestDatabaseConfig()
    const db = new PostgreSQLAdapter(config.connectionString!)

    // Run all migrations
    const result = await runMigrations(db, false) // silent mode
    console.log(`   ✅ Ran ${result.ran} migrations`)
}
