/**
 * Test Setup File
 * 
 * Runs before each test file to set up the test environment.
 * - Initializes environment variables
 * - Provides global test utilities
 */

import { beforeEach, afterEach } from 'vitest'

// Set test environment
process.env.NODE_ENV = 'test'

// Ensure test database configuration is loaded
import { testDbConfig } from '../../server/database/test-config.js'

// Set environment variables for database adapter to use test config
if (testDbConfig.type === 'postgresql') {
    process.env.DATABASE_TYPE = 'postgresql'
    process.env.DATABASE_URL = testDbConfig.connectionString
} else {
    process.env.DATABASE_TYPE = 'sqlite'
    // SQLite test path will be set by test utilities
}

// Global test lifecycle hooks can be added here
beforeEach(() => {
    // Reset any global state before each test
})

afterEach(() => {
    // Cleanup after each test
})
