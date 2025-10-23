/**
 * Migration Runner
 * Orchestrates database migrations and tracks which have been run
 */

import type { DatabaseAdapter } from '../adapter'
import { runBaseSchemaMigration, metadata as baseMeta } from './000_base_schema'
import { runConfigTableMigration, metadata as configMeta } from './001_init_schema'
import { runSchemaAlignmentMigration, metadata as alignMeta } from './002_align_schema'
import { migration as migration003 } from './003_entity_task_triggers'
import { migration as migration006 } from './006_add_watch_task_fields'
import { migration as migration007 } from './007_create_config_table'
import { migration as migration008 } from './008_add_isbase_to_entities'
import { migration as migration009 } from './009_add_project_relationships'
import { migration as migration010 } from './010_add_entity_name_to_tasks'
import { migration as migration011 } from './011_add_event_type'
import { migration as migration012 } from './012_add_extended_fields'
import { migration as migration013 } from './013_alter_project_status_and_add_pages'
import { migration as migration014 } from './014_add_computed_columns_and_seed'
import { migration as migration015 } from './015_domain_system_and_extensions'
import { migration as migration016 } from './016_users_email_format'
import migration017 from './017_project_role_tables'
import { migration as migration018 } from './018_update_projects_schema'
import { migration as migration019 } from './019_add_tags_status_ids'
import { migration as migration020 } from './020_refactor_entities'
import { migration as migration021 } from './021_seed_system_data'

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
    { run: runSchemaAlignmentMigration, metadata: alignMeta },
    { run: migration003.up, metadata: { id: migration003.id, description: migration003.description, version: '0.0.1', date: '2025-10-16' } },
    { run: migration006.up, metadata: { id: migration006.id, description: migration006.description, version: '0.0.1', date: '2025-10-16' } },
    { run: migration007.up, metadata: { id: migration007.id, description: migration007.description, version: '0.0.1', date: '2025-10-16' } },
    { run: migration008.up, metadata: { id: migration008.id, description: migration008.description, version: '0.0.2', date: '2025-10-16' } },
    { run: migration009.up, metadata: { id: migration009.id, description: migration009.description, version: '0.0.3', date: '2025-10-16' } },
    { run: migration010.up, metadata: { id: migration010.id, description: migration010.description, version: '0.0.3', date: '2025-10-16' } },
    { run: migration011.up, metadata: { id: migration011.id, description: migration011.description, version: '0.0.4', date: '2025-10-17' } },
    { run: migration012.up, metadata: { id: migration012.id, description: migration012.description, version: '0.0.5', date: '2025-10-17' } },
    { run: migration013.up, metadata: { id: migration013.id, description: migration013.description, version: '0.0.6', date: '2025-10-17' } },
    { run: migration014.up, metadata: { id: migration014.id, description: migration014.description, version: '0.0.7', date: '2025-10-17' } },
    { run: migration015.up, metadata: { id: migration015.id, description: migration015.description, version: '0.0.8', date: '2025-10-21' } },
    { run: migration016.up, metadata: { id: migration016.id, description: migration016.description, version: '0.0.9', date: '2025-10-21' } },
    { run: migration017.up, metadata: { id: migration017.id, description: migration017.name, version: '0.0.10', date: '2025-10-21' } },
    { run: migration018.up, metadata: { id: migration018.id, description: migration018.description, version: '0.0.11', date: '2025-10-22' } },
    { run: migration019.up, metadata: { id: migration019.id, description: migration019.description, version: '0.0.12', date: '2025-10-22' } },
    { run: migration020.up, metadata: { id: migration020.id, description: migration020.description, version: '0.0.13', date: '2025-10-22' } },
    { run: migration021.up, metadata: { id: migration021.id, description: migration021.description, version: '0.0.14', date: '2025-10-22' } },
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
    try {
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
    } catch (error: any) {
        // If crearis_config doesn't exist yet (e.g., during first migration),
        // silently skip tracking. The config table migration will initialize tracking.
        if (error.code === '42P01' || error.message?.includes('no such table')) {
            console.log(`  ⚠️  Skipping migration tracking (config table not yet created)`)
            return
        }
        throw error
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
