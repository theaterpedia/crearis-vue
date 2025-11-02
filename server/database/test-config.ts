/**
 * Test Database Configuration
 * 
 * Provides isolated database configuration for testing.
 * - SQLite uses in-memory database for fast, isolated tests
 * - PostgreSQL uses separate test database to avoid data conflicts
 */

export interface TestDatabaseConfig {
    type: 'sqlite' | 'postgresql'
    connectionString?: string
    dbPath?: string
}

/**
 * Get test database configuration based on environment
 */
export function getTestDatabaseConfig(): TestDatabaseConfig {
    const testDbType = process.env.TEST_DATABASE_TYPE || 'sqlite'

    if (testDbType === 'postgresql') {
        // PostgreSQL test database
        let testDbUrl = process.env.TEST_DATABASE_URL

        if (!testDbUrl) {
            // Build from environment variables (same as main config, but with _test database)
            const dbUser = process.env.DB_USER
            const dbPassword = process.env.DB_PASSWORD
            const dbHost = process.env.DB_HOST || 'localhost'
            const dbPort = process.env.DB_PORT || '5432'

            if (dbUser && dbPassword) {
                const testDbName = process.env.TEST_DB_NAME || `${process.env.DB_NAME}_test` || 'demo_data_test'
                testDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${testDbName}`
            } else {
                // Fallback to default
                testDbUrl = 'postgresql://localhost:5432/demo_data_test'
            }
        }

        return {
            type: 'postgresql',
            connectionString: testDbUrl
        }
    }

    // SQLite in-memory database (DEPRECATED - will fail in Migration 019+)
    console.warn('\n⚠️  WARNING: SQLite test mode is deprecated (Migration 019+)')
    console.warn('   Set TEST_DATABASE_TYPE=postgresql to run tests')
    console.warn('   Tests will fail if schema uses PostgreSQL-specific features\n')

    return {
        type: 'sqlite',
        dbPath: ':memory:'
    }
}

/**
 * Test database configuration singleton
 */
export const testDbConfig = getTestDatabaseConfig()

/**
 * Check if running PostgreSQL tests
 */
export function isPostgreSQLTest(): boolean {
    return testDbConfig.type === 'postgresql'
}

/**
 * Check if running SQLite tests
 */
export function isSQLiteTest(): boolean {
    return testDbConfig.type === 'sqlite'
}

/**
 * Get test database display name
 */
export function getTestDatabaseName(): string {
    if (testDbConfig.type === 'postgresql') {
        const url = testDbConfig.connectionString || ''
        const match = url.match(/\/([^/?]+)(\?|$)/)
        return match ? match[1] : 'demo_data_test'
    }
    return ':memory:'
}
