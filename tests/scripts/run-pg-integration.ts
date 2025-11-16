#!/usr/bin/env node
/**
 * Batch Test Runner for PostgreSQL Integration Tests
 * 
 * Runs all tests tagged with @pgintegration in a single batch
 * with visual results and detailed reporting.
 * 
 * Usage:
 *   pnpm test:pgintegration
 *   pnpm test:pgintegration:batch
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'

const execAsync = promisify(exec)

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
}

function log(message: string, color?: keyof typeof colors) {
    const colorCode = color ? colors[color] : ''
    console.log(`${colorCode}${message}${colors.reset}`)
}

async function runPgIntegrationTests() {
    log('\n' + '='.repeat(60), 'cyan')
    log('  PostgreSQL Integration Tests - Batch Runner', 'bright')
    log('='.repeat(60) + '\n', 'cyan')

    // Check if test results directory exists
    if (!existsSync('./test-results')) {
        await mkdir('./test-results', { recursive: true })
    }

    // Set environment for PostgreSQL tests
    const env = {
        ...process.env,
        TEST_DATABASE_TYPE: 'postgresql',
        TEST_DATABASE_URL: process.env.TEST_DATABASE_URL ||
            process.env.DATABASE_URL?.replace(/\/([^/]+)$/, '/demo_data_test') ||
            'postgresql://localhost:5432/demo_data_test'
    }

    log('Configuration:', 'blue')
    log(`  Database Type: PostgreSQL`)
    log(`  Database URL: ${env.TEST_DATABASE_URL}`)
    log('')

    try {
        log('Running tests with @pgintegration tag...', 'yellow')
        log('')

        // Run vitest with grep filter for @pgintegration
        const { stdout, stderr } = await execAsync(
            'npx vitest run --reporter=verbose --reporter=html --grep="@pgintegration"',
            {
                env,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large output
            }
        )

        // Display output
        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)

        log('\n' + '='.repeat(60), 'green')
        log('  ✅ All PostgreSQL Integration Tests Passed!', 'bright')
        log('='.repeat(60), 'green')
        log('\nTest Results:', 'blue')
        log(`  HTML Report: ./test-results/index.html`)
        log(`  JSON Results: ./test-results/results.json`)
        log('')

        return 0
    } catch (error: any) {
        log('\n' + '='.repeat(60), 'red')
        log('  ❌ PostgreSQL Integration Tests Failed', 'bright')
        log('='.repeat(60), 'red')

        if (error.stdout) console.log(error.stdout)
        if (error.stderr) console.error(error.stderr)

        log('\nPossible Issues:', 'yellow')
        log('  1. PostgreSQL server not running')
        log('  2. Test database not created (run: createdb demo_data_test)')
        log('  3. Database connection string incorrect')
        log('  4. Missing pg package (run: pnpm install pg @types/pg)')
        log('')

        return 1
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runPgIntegrationTests()
        .then(code => process.exit(code))
        .catch(error => {
            console.error('Fatal error:', error)
            process.exit(1)
        })
}

export { runPgIntegrationTests }
