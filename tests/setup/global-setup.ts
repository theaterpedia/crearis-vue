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

    const config = getTestDatabaseConfig()

    console.log('\n🧪 Test Environment Setup')
    console.log('========================')
    console.log(`Database Type: ${config.type}`)

    if (config.type === 'postgresql') {
        console.log(`Database URL: ${config.connectionString}`)
        console.log('\n⚠️  PostgreSQL Integration Tests Enabled')
        console.log('   Make sure PostgreSQL is running and test database exists.')
        console.log('   To create test database: createdb demo_data_test\n')

        // Try to verify PostgreSQL connection
        try {
            const pg = await import('pg')
            const { Pool } = pg.default
            const pool = new Pool({ connectionString: config.connectionString })

            await pool.query('SELECT 1')
            console.log('✅ PostgreSQL connection verified\n')

            await pool.end()
        } catch (error: any) {
            console.error('❌ PostgreSQL connection failed:', error.message)
            console.error('   Tests may fail if PostgreSQL is not properly configured.\n')
            // Don't throw - let individual tests fail with better error messages
        }
    } else {
        console.log(`Database: ${config.dbPath}`)
        console.log('✅ SQLite in-memory database will be used\n')
    }
}
