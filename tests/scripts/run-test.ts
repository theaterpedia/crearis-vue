#!/usr/bin/env node
/**
 * Individual Test Runner
 * 
 * Runs a specific test file or test pattern one at a time
 * with detailed output for debugging.
 * 
 * Usage:
 *   node tests/scripts/run-test.ts <test-pattern>
 *   
 * Examples:
 *   node tests/scripts/run-test.ts database-adapter
 *   node tests/scripts/run-test.ts "should insert and retrieve"
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

async function runSingleTest(pattern: string, usePg: boolean = false) {
    log('\n' + '='.repeat(60), 'cyan')
    log('  Individual Test Runner', 'bright')
    log('='.repeat(60) + '\n', 'cyan')

    const dbType = usePg ? 'PostgreSQL' : 'SQLite'
    log(`Test Pattern: ${pattern}`, 'blue')
    log(`Database: ${dbType}`, 'blue')
    log('')

    // Set environment
    const env = {
        ...process.env,
        TEST_DATABASE_TYPE: usePg ? 'postgresql' : 'sqlite'
    }

    if (usePg) {
        env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
            process.env.DATABASE_URL?.replace(/\/([^/]+)$/, '/demo_data_test') ||
            'postgresql://localhost:5432/demo_data_test'
        log(`Database URL: ${env.TEST_DATABASE_URL}`, 'blue')
        log('')
    }

    try {
        log('Running test...', 'yellow')
        log('')

        // Run vitest with specific test pattern
        const command = `npx vitest run --reporter=verbose --grep="${pattern}"`

        const { stdout, stderr } = await execAsync(command, {
            env,
            maxBuffer: 10 * 1024 * 1024
        })

        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)

        log('\n' + '='.repeat(60), 'green')
        log('  ✅ Test Passed!', 'bright')
        log('='.repeat(60) + '\n', 'green')

        return 0
    } catch (error: any) {
        log('\n' + '='.repeat(60), 'red')
        log('  ❌ Test Failed', 'bright')
        log('='.repeat(60) + '\n', 'red')

        if (error.stdout) console.log(error.stdout)
        if (error.stderr) console.error(error.stderr)

        return 1
    }
}

// Parse command line arguments
const args = process.argv.slice(2)
const pattern = args[0]
const usePg = args.includes('--pg') || args.includes('--postgresql')

if (!pattern) {
    log('Usage: node tests/scripts/run-test.ts <test-pattern> [--pg]', 'yellow')
    log('\nExamples:', 'blue')
    log('  node tests/scripts/run-test.ts database-adapter')
    log('  node tests/scripts/run-test.ts "should insert and retrieve"')
    log('  node tests/scripts/run-test.ts "Basic Operations" --pg')
    process.exit(1)
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runSingleTest(pattern, usePg)
        .then(code => process.exit(code))
        .catch(error => {
            console.error('Fatal error:', error)
            process.exit(1)
        })
}

export { runSingleTest }
