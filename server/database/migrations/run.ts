/**
 * Standalone Migration Runner Script
 * Run with: pnpm db:migrate
 */

import { db } from '../db-new'
import { runMigrations, getMigrationStatus } from './index'

async function main() {
    console.log('🔍 Checking migration status...\n')

    const statusBefore = await getMigrationStatus(db)

    console.log('📊 Current Status:')
    console.log(`   Total migrations: ${statusBefore.total}`)
    console.log(`   Completed: ${statusBefore.completed}`)
    console.log(`   Pending: ${statusBefore.pending}`)

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

    console.log('\n🚀 Running pending migrations...\n')
    const result = await runMigrations(db, true)

    console.log('✅ Migration complete!')
    process.exit(0)
}

main().catch(error => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
})
