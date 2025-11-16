#!/usr/bin/env tsx
/**
 * Run Migration 021 Only
 * 
 * This script runs migration 021 (System Data Seeding) manually.
 * Migration 021 is marked as manualOnly and won't run automatically.
 * 
 * Usage:
 *   pnpm run-migration-021
 *   or: pnpm tsx server/scripts/run-migration-021.ts
 */

import { config as loadEnv } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
loadEnv({ path: resolve(__dirname, '../../.env') })

async function main() {
    console.log('\n🚀 Running Migration 021 (System Data Seeding)')
    console.log('='.repeat(70))
    console.log(`Date: ${new Date().toISOString()}`)
    console.log('='.repeat(70))

    // Import database and migration dynamically
    const { db } = await import('../database/db-new.js')
    const { migration } = await import('../database/migrations/021_seed_system_data.js')

    console.log(`\n🔌 Connected to database (${db.type})`)

    try {
        // Check if already run
        console.log('\n🔍 Checking migration status...')
        const result = await db.get(
            'SELECT id, applied_at FROM migrations WHERE id = ?',
            ['021_seed_system_data']
        )

        if (result) {
            console.log('\n⚠️  Migration 021 already applied!')
            console.log(`   Applied at: ${result.applied_at}`)
            console.log('\n💡 To re-run (DANGEROUS - will duplicate data):')
            console.log('   1. Delete migration record: DELETE FROM migrations WHERE id = \'021_seed_system_data\';')
            console.log('   2. Manually clean seeded data (status, tags, users, projects, etc.)')
            console.log('   3. Run this script again')
            console.log('\n⚠️  WARNING: Re-running without cleaning will cause duplicate key errors!')
            process.exit(0)
        }

        console.log('   ✅ Migration 021 not yet applied\n')

        // Run the migration
        console.log('📦 Running migration 021...\n')
        await migration.up(db)

        // Mark as complete
        console.log('\n💾 Marking migration as complete...')
        if (db.type === 'postgresql') {
            await db.run(
                'INSERT INTO migrations (id, applied_at) VALUES ($1, CURRENT_TIMESTAMP)',
                ['021_seed_system_data']
            )
        } else {
            await db.run(
                'INSERT INTO migrations (id, applied_at) VALUES (?, datetime(\'now\'))',
                ['021_seed_system_data']
            )
        }

        console.log('\n' + '='.repeat(70))
        console.log('✅ Migration 021 completed successfully!')
        console.log('='.repeat(70))
        console.log('\n📊 Seeded Data:')
        console.log('   - System tables: tags, status')
        console.log('   - Config: watchcsv, watchdb')
        console.log('   - Projects: tp, regio1')
        console.log('   - System domains and TLDs')
        console.log('   - System users (passwords in PASSWORDS.csv)')
        console.log('   - Project memberships')
        console.log('   - Base pages')
        console.log('\n⚠️  IMPORTANT: Check PASSWORDS.csv for system user credentials')
        console.log(`   Location: ${process.env.DATA_DIR || '/opt/crearis/data'}/PASSWORDS.csv\n`)

        process.exit(0)

    } catch (error) {
        console.error('\n❌ Migration 021 failed!')
        console.error('='.repeat(70))
        console.error(error)
        console.error('='.repeat(70))
        console.error('\n💡 Common issues:')
        console.error('   - Database not initialized (run migrations 000-020 first)')
        console.error('   - Required tables missing (users, projects, status, tags, etc.)')
        console.error('   - Data files not found (check DATA_DIR and FILESET settings)')
        console.error('   - Foreign key violations (check data dependencies)\n')
        process.exit(1)
    }
}

// Run main function
main().catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
})
