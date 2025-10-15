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
        // Default: postgresql://localhost:5432/demo_data_test
        const testDbUrl = process.env.TEST_DATABASE_URL ||
            process.env.DATABASE_URL?.replace(/\/([^/]+)$/, '/demo_data_test') ||
            'postgresql://localhost:5432/demo_data_test'

        return {
            type: 'postgresql',
            connectionString: testDbUrl
        }
    }

    // SQLite in-memory database (default for tests)
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
