/**
 * Migration Runner
 * Orchestrates database migrations and tracks which have been run
 */

import type { DatabaseAdapter } from '../adapter'
import { runBaseSchemaMigration, metadata as baseMeta } from './000_base_schema'
import { runConfigTableMigration, metadata as configMeta } from './001_init_schema'

interface Migration {
    run: (db: DatabaseAdapter) => Promise<void>
    metadata: {
        id: string
        description: string
        version: string
        date: string
    }
}

// Registry of all available migrations
const migrations: Migration[] = [
    { run: runBaseSchemaMigration, metadata: baseMeta },
    { run: runConfigTableMigration, metadata: configMeta },
]

/**
 * Get list of migrations that have already been run
 */
async function getMigrationsRun(db: DatabaseAdapter): Promise<string[]> {
    try {
        const result = await db.get('SELECT config FROM crearis_config WHERE id = 1', [])
        if (!result) return []

        const config = JSON.parse((result as any).config)
        return config.migrations_run || []
    } catch (error) {
        // If table doesn't exist yet, no migrations have been run
        return []
    }
}

/**
 * Mark a migration as run
 */
async function markMigrationRun(db: DatabaseAdapter, migrationId: string) {
    const isPostgres = db.type === 'postgresql'
    const migrationsRun = await getMigrationsRun(db)

    if (!migrationsRun.includes(migrationId)) {
        migrationsRun.push(migrationId)
    }

    if (isPostgres) {
        await db.run(
            `UPDATE crearis_config 
       SET config = jsonb_set(config, '{migrations_run}', $1::jsonb)
       WHERE id = 1`,
            [JSON.stringify(migrationsRun)]
        )
    } else {
        const result = await db.get('SELECT config FROM crearis_config WHERE id = 1', [])
        const config = JSON.parse((result as any).config)
        config.migrations_run = migrationsRun

        await db.run(
            'UPDATE crearis_config SET config = ? WHERE id = 1',
            [JSON.stringify(config)]
        )
    }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(db: DatabaseAdapter, verbose = true) {
    if (verbose) {
        console.log('\n🔄 Starting database migrations...\n')
    }

    const migrationsRun = await getMigrationsRun(db)
    let ranCount = 0

    for (const migration of migrations) {
        if (migrationsRun.includes(migration.metadata.id)) {
            if (verbose) {
                console.log(`⏭️  Skipping migration: ${migration.metadata.id} (already run)`)
            }
            continue
        }

        if (verbose) {
            console.log(`\n📦 Running migration: ${migration.metadata.id}`)
            console.log(`   Description: ${migration.metadata.description}`)
        }

        try {
            await migration.run(db)
            await markMigrationRun(db, migration.metadata.id)
            ranCount++

            if (verbose) {
                console.log(`✅ Completed: ${migration.metadata.id}`)
            }
        } catch (error) {
            console.error(`\n❌ Migration failed: ${migration.metadata.id}`)
            console.error(error)
            throw error
        }
    }

    if (verbose) {
        console.log(`\n✅ Migrations complete: ${ranCount} migration(s) run, ${migrationsRun.length} already applied`)
        console.log(`📊 Total migrations in system: ${migrations.length}\n`)
    }

    return { ran: ranCount, total: migrations.length, alreadyApplied: migrationsRun.length }
}

/**
 * Get migration status without running anything
 */
export async function getMigrationStatus(db: DatabaseAdapter) {
    const migrationsRun = await getMigrationsRun(db)
    const pending = migrations.filter(m => !migrationsRun.includes(m.metadata.id))

    return {
        total: migrations.length,
        completed: migrationsRun.length,
        pending: pending.length,
        completedMigrations: migrationsRun,
        pendingMigrations: pending.map(m => m.metadata),
    }
}
