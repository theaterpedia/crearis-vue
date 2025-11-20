/**
 * Test Setup File
 * 
 * Runs before each test file to set up the test environment.
 * - Initializes environment variables
 * - Provides global test utilities
 * - Mocks composables like useI18n
 */

import { beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { ref } from 'vue'

// Load environment variables from .env file
try {
    const envPath = resolve(process.cwd(), '.env')
    const envFile = readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim()
            if (key && !process.env[key]) {
                process.env[key] = value
            }
        }
    })
} catch (error) {
    // .env file not found or not readable - continue with system environment variables
}

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

// Mock useI18n composable for tests
vi.mock('@/composables/useI18n', () => ({
    useI18n: () => ({
        currentLanguage: ref('de'),
        setLanguage: vi.fn(),
        t: vi.fn((key: string) => key),
        resolveText: vi.fn((entry: any, lang?: string) => {
            const l = lang || 'de'
            return entry?.[l] || entry?.de || entry?.en || ''
        })
    })
}))

// Global test lifecycle hooks can be added here
beforeEach(() => {
    // Reset any global state before each test
})

afterEach(() => {
    // Cleanup after each test
})
