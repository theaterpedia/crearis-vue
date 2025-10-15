/**
 * Standalone Migration Runner Script
 * Run with: pnpm db:migrate
 * Or check status: pnpm db:migrate:status (or pnpm db:migrate --status)
 */

import { db } from '../db-new'
import { runMigrations, getMigrationStatus } from './index'

async function main() {
    // Check if --status flag is provided
    const statusOnly = process.argv.includes('--status')

    console.log('🔍 Checking migration status...\n')

    const statusBefore = await getMigrationStatus(db)

    console.log('📊 Current Status:')
    console.log(`   Total migrations: ${statusBefore.total}`)
    console.log(`   Completed: ${statusBefore.completed}`)
    console.log(`   Pending: ${statusBefore.pending}`)

    if (statusBefore.completedMigrations.length > 0) {
        console.log('\n✅ Completed migrations:')
        statusBefore.completedMigrations.forEach(migrationId => {
            console.log(`   - ${migrationId}`)
        })
    }

    if (statusBefore.pending > 0) {
        console.log('\n📋 Pending migrations:')
        statusBefore.pendingMigrations.forEach(m => {
            console.log(`   - ${m.id}: ${m.description}`)
        })
    }

    if (statusBefore.pending === 0) {
        console.log('\n✅ All migrations are up to date!')
        process.exit(0)
    }

    // If --status flag, exit after showing status
    if (statusOnly) {
        process.exit(0)
    }

    console.log('\n🚀 Running pending migrations...\n')
    const result = await runMigrations(db, true)

    console.log('\n✅ Migration complete!')
    console.log(`   ${result.ran} migration(s) executed`)
    console.log(`   ${result.alreadyApplied} migration(s) already applied`)
    process.exit(0)
}

main().catch(error => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
})
