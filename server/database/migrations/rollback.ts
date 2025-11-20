#!/usr/bin/env node
/**
 * Migration Rollback Tool
 * 
 * Rolls back database migrations to previous state.
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * Code automation tools should use pnpm commands only.
 * 
 * Usage:
 *   pnpm db:rollback          # Rollback last migration
 *   pnpm db:rollback 3        # Rollback last 3 migrations
 *   pnpm db:rollback --to=020 # Rollback to migration 020
 * 
 * ⚠️  DO NOT USE: npm run db:rollback (use pnpm instead)
 * 
 * Safety:
 *   - Only works with reversible migrations (have down() function)
 *   - Runs in reverse order (newest first)
 *   - Updates crearis_config.migrations_run array
 *   - Non-reversible migrations are skipped with warning
 */

import { db } from '../init.js'
import { rollbackMigrations, rollbackToMigration, getMigrationStatus } from './index.js'

async function main() {
    const args = process.argv.slice(2)

    console.log('\n🔧 Migration Rollback Tool\n')
    console.log('='.repeat(50))

    // Check current status
    const status = await getMigrationStatus(db)
    console.log(`\n📊 Current Status:`)
    console.log(`   Total migrations: ${status.total}`)
    console.log(`   Completed: ${status.completed}`)
    console.log(`   Pending: ${status.pending}`)

    if (status.completed === 0) {
        console.log(`\nℹ️  No migrations to rollback`)
        process.exit(0)
    }

    console.log(`\n   Last migration: ${status.completedMigrations[status.completedMigrations.length - 1]}`)
    console.log()

    // Parse arguments
    let count = 1
    let targetMigration: string | null = null

    if (args.length > 0) {
        const arg = args[0]

        if (arg.startsWith('--to=')) {
            // Rollback to specific migration
            targetMigration = arg.split('=')[1]

            // Normalize migration ID format
            if (/^\d+$/.test(targetMigration)) {
                targetMigration = targetMigration.padStart(3, '0')
            }
            if (!targetMigration.includes('_')) {
                targetMigration = `migration-${targetMigration}`
            }

            console.log(`🎯 Target: Rollback to ${targetMigration}\n`)
        } else if (/^\d+$/.test(arg)) {
            // Rollback N migrations
            count = parseInt(arg, 10)
            console.log(`🎯 Target: Rollback last ${count} migration(s)\n`)
        } else {
            console.error(`❌ Invalid argument: ${arg}`)
            console.error(`\nUsage:`)
            console.error(`  pnpm db:rollback          # Rollback last migration`)
            console.error(`  pnpm db:rollback 3        # Rollback last 3 migrations`)
            console.error(`  pnpm db:rollback --to=020 # Rollback to migration 020`)
            process.exit(1)
        }
    } else {
        console.log(`🎯 Target: Rollback last migration\n`)
    }

    // Confirm action
    console.log(`⚠️  WARNING: This will modify the database!`)
    console.log(`   Ensure you have a backup before proceeding.\n`)

    // Check for --force flag
    const hasForce = args.includes('--force')

    if (!hasForce) {
        console.log(`   Run with --force to execute, or Ctrl+C to cancel`)
        console.log(`   Example: pnpm db:rollback ${args.filter(a => a !== '--force').join(' ')} --force\n`)
        process.exit(0)
    }

    console.log('='.repeat(50))

    try {
        let result

        if (targetMigration) {
            result = await rollbackToMigration(db, targetMigration, true)
        } else {
            result = await rollbackMigrations(db, count, true)
        }

        console.log('='.repeat(50))
        console.log(`\n🎉 Rollback successful!`)
        console.log(`   Rolled back: ${result.rolledBack}`)
        console.log(`   Skipped: ${result.skipped}\n`)

        // Show updated status
        const newStatus = await getMigrationStatus(db)
        console.log(`📊 New Status:`)
        console.log(`   Completed: ${newStatus.completed}`)
        console.log(`   Pending: ${newStatus.pending}`)

        if (newStatus.completed > 0) {
            console.log(`   Last migration: ${newStatus.completedMigrations[newStatus.completedMigrations.length - 1]}`)
        }
        console.log()

    } catch (error) {
        console.error('\n❌ Rollback failed!')
        console.error(error)
        console.error(`\n⚠️  Database may be in inconsistent state`)
        console.error(`   Check logs above for details`)
        console.error(`   Manual intervention may be required\n`)
        process.exit(1)
    }
}

main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
