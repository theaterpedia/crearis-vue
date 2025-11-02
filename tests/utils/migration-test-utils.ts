/**
 * Database Migration Test Utilities
 * 
 * Helpers for tests that require full database schema with migrations.
 * Provides setup for tests that need PostgreSQL-specific features.
 */

import { describe } from 'vitest'
import { PostgreSQLAdapter } from '../../server/database/adapters/postgresql.js'
import { testDbConfig, isPostgreSQLTest } from '../../server/database/test-config.js'
import type { DatabaseAdapter } from '../../server/database/adapter.js'
import { runMigrations } from '../../server/database/migrate.js'

// Track if migrations have been run for this test session
let migrationsRun = false

/**
 * Create test database with full migrations
 * Use this for integration tests that need the complete schema
 */
export async function createTestDatabaseWithMigrations(): Promise<DatabaseAdapter> {
    if (!isPostgreSQLTest()) {
        throw new Error(
            'Migration-based tests require PostgreSQL. ' +
            'Set TEST_DATABASE_TYPE=postgresql'
        )
    }

    if (!testDbConfig.connectionString) {
        throw new Error('PostgreSQL connection string not configured for tests')
    }

    const adapter = new PostgreSQLAdapter(testDbConfig.connectionString)

    // Run migrations only once per test session
    if (!migrationsRun) {
        console.log('   🔄 Running database migrations for test environment...')

        try {
            // Drop all tables first for clean slate
            await dropAllTables(adapter)

            // Run all migrations
            await runMigrations(adapter, { verbose: false })

            migrationsRun = true
            console.log('   ✅ Migrations completed')
        } catch (error) {
            console.error('   ❌ Migration failed:', error)
            throw error
        }
    }

    return adapter
}

/**
 * Drop all tables in the test database
 * DANGEROUS: Only use in test environment
 */
async function dropAllTables(db: DatabaseAdapter): Promise<void> {
    // Get all table names
    const tables = await db.all(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    `)

    // Drop each table
    for (const table of tables) {
        await db.exec(`DROP TABLE IF EXISTS ${table.tablename} CASCADE`)
    }

    // Drop all custom types
    const types = await db.all(`
        SELECT typname 
        FROM pg_type 
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typtype = 'e'
    `)

    for (const type of types) {
        await db.exec(`DROP TYPE IF EXISTS ${type.typname} CASCADE`)
    }
}

/**
 * Clean up test data (but keep schema)
 * Use this in afterEach to reset data between tests
 */
export async function cleanupTestData(db: DatabaseAdapter): Promise<void> {
    // Disable triggers temporarily for faster deletion
    await db.exec('SET session_replication_role = replica')

    // Get all table names
    const tables = await db.all(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        ORDER BY tablename
    `)

    // Truncate all tables (faster than DELETE)
    for (const table of tables) {
        try {
            await db.exec(`TRUNCATE TABLE ${table.tablename} RESTART IDENTITY CASCADE`)
        } catch (error) {
            // Some tables might not exist or have constraints - that's OK
            console.warn(`   ⚠️  Could not truncate ${table.tablename}`)
        }
    }

    // Re-enable triggers
    await db.exec('SET session_replication_role = DEFAULT')
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection(db: DatabaseAdapter): Promise<void> {
    await db.close()
}

/**
 * Wrapper for describe that skips if not PostgreSQL
 * Use this for tests that require migrations
 */
export const describeWithMigrations = isPostgreSQLTest() ? describe : describe.skip

/**
 * Reset migration state (for testing purposes)
 */
export function resetMigrationState(): void {
    migrationsRun = false
}
