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
        // Check if already run (uses new crearis_config tracking system)
        console.log('\n🔍 Checking migration status...')

        const configResult = await db.get(
            'SELECT config FROM crearis_config WHERE id = 1',
            []
        )

        if (configResult) {
            const configJson = (configResult as any).config
            const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson
            const migrationsRun = config.migrations_run || []

            if (migrationsRun.includes('021_seed_system_data')) {
                console.log('\n⚠️  Migration 021 already applied!')
                console.log(`   Found in migrations_run array`)
                console.log('\n💡 To re-run (DANGEROUS - will duplicate data):')
                console.log('   1. Remove from tracking: UPDATE crearis_config SET config = jsonb_set(config, \'{migrations_run}\', \'[]\') WHERE id = 1;')
                console.log('   2. Manually clean seeded data (status, tags, users, projects, etc.)')
                console.log('   3. Run this script again')
                console.log('\n⚠️  WARNING: Re-running without cleaning will cause duplicate key errors!')
                process.exit(0)
            }
        } else {
            console.log('\n⚠️  Config table not found or empty!')
            console.log('   This likely means base migrations (000-020) have not been run.')
            console.log('   Run: pnpm db:migrate')
            process.exit(1)
        }

        console.log('   ✅ Migration 021 not yet applied\n')

        // Run the migration
        console.log('📦 Running migration 021...\n')
        await migration.up(db)

        // Mark as complete (add to migrations_run array in crearis_config)
        console.log('\n💾 Marking migration as complete...')

        const currentConfig = await db.get('SELECT config FROM crearis_config WHERE id = 1', [])
        const configJson = (currentConfig as any).config
        const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson
        const migrationsRun = config.migrations_run || []

        if (!migrationsRun.includes('021_seed_system_data')) {
            migrationsRun.push('021_seed_system_data')
        }

        if (db.type === 'postgresql') {
            await db.run(
                'UPDATE crearis_config SET config = jsonb_set(config, \'{migrations_run}\', $1::jsonb) WHERE id = 1',
                [JSON.stringify(migrationsRun)]
            )
        } else {
            config.migrations_run = migrationsRun
            await db.run(
                'UPDATE crearis_config SET config = ? WHERE id = 1',
                [JSON.stringify(config)]
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
