/**
 * Migration Runner
 * Orchestrates database migrations and tracks which have been run
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * Code automation tools should use pnpm commands only.
 * 
 * Run migrations: pnpm db:migrate
 * Check status: pnpm db:migrate:status
 * Rollback: pnpm db:rollback --force
 * 
 * ⚠️  DO NOT USE: npm run db:migrate (use pnpm instead)
 */

import type { DatabaseAdapter } from '../adapter'
import { getMigrationPackageRange, filterMigrationsByPackage } from './packages'
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
import { migration as migration022 } from './022_create_sysreg'
import { migration as migration023 } from './023_deprecate_old_tables'
import { migration as migration024 } from './024_create_inherited_tables'
import { migration as migration025 } from './025_align_entity_tables'
import { migration as migration026 } from './026_seed_new_sysreg_entries'
import { migration as migration027 } from './027_migrate_status_data'
import { migration as migration028 } from './028_integrate_sysreg_i18n'
import { migration as migration029 } from './029_move_sysreg_to_child_tables'
import { migration as migration030 } from './030_drop_legacy_status_columns'
import migration031 from './031_add_local_adapter'
import { migration as migration035 } from './035_rename_val_columns'
import { migration as migration036 } from './036_bytea_to_integer'
import { migration as migration037 } from './037_dtags_restructure'
import { migration as migration038 } from './038_ctags_ttags_restructure'
import { migration as migration039 } from './039_status_restructure'
// Migrations 022-024 archived to archived_data_seeds/ (replaced by data packages)

interface Migration {
    run: (db: DatabaseAdapter) => Promise<void>
    down?: (db: DatabaseAdapter) => Promise<void>  // Optional rollback function
    metadata: {
        id: string
        description: string
        version: string
        date: string
    }
    manualOnly?: boolean  // If true, skip in auto-run (requires env flag)
    reversible?: boolean  // If true, has safe down() implementation
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
    { run: migration017.up, down: migration017.down, metadata: { id: migration017.id, description: migration017.name, version: '0.0.10', date: '2025-10-21' }, reversible: true },
    { run: migration018.up, metadata: { id: migration018.id, description: migration018.description, version: '0.0.11', date: '2025-10-22' } },
    { run: migration019.up, metadata: { id: migration019.id, description: migration019.description, version: '0.0.12', date: '2025-10-22' } },
    { run: migration020.up, metadata: { id: migration020.id, description: migration020.description, version: '0.0.13', date: '2025-10-22' } },
    { run: migration021.up, down: migration021.down, metadata: { id: migration021.id, description: migration021.description, version: '0.0.14', date: '2025-10-22' }, manualOnly: true, reversible: true },
    // Package C (022-029) starts here - reversible migrations for alpha features
    { run: migration022.up, down: migration022.down, metadata: { id: migration022.id, description: migration022.description, version: '0.1.0', date: '2025-11-19' }, reversible: true },
    { run: migration023.up, down: migration023.down, metadata: { id: migration023.id, description: migration023.description, version: '0.1.0', date: '2025-11-19' }, reversible: true },
    { run: migration024.up, down: migration024.down, metadata: { id: migration024.id, description: migration024.description, version: '0.1.0', date: '2025-11-19' }, reversible: true },
    { run: migration025.up, down: migration025.down, metadata: { id: migration025.id, description: migration025.description, version: '0.1.0', date: '2025-11-19' }, reversible: true },
    { run: migration026.up, down: migration026.down, metadata: { id: migration026.id, description: migration026.description, version: '0.1.0', date: '2025-11-19' }, reversible: true },
    { run: migration027.up, down: migration027.down, metadata: { id: migration027.id, description: migration027.description, version: '0.1.0', date: '2025-11-19' }, reversible: true },
    { run: migration028.up, down: migration028.down, metadata: { id: migration028.id, description: migration028.description, version: '0.1.0', date: '2025-11-19' }, reversible: true },
    { run: migration029.up, down: migration029.down, metadata: { id: migration029.id, description: migration029.description, version: '0.1.0', date: '2025-11-19' }, reversible: true },
    { run: migration030.up, down: migration030.down, metadata: { id: migration030.id, description: migration030.description, version: '0.1.0', date: '2025-11-19' }, reversible: false },
    { run: async (db) => await db.run(migration031, []), metadata: { id: '031_add_local_adapter', description: 'Add local adapter to media_adapter_type enum', version: '0.1.1', date: '2025-11-20' }, reversible: false },
    // Package D (035+) - Schema standardization
    { run: migration035.up, down: migration035.down, metadata: { id: migration035.id, description: migration035.description, version: '0.2.0', date: '2025-11-26' }, reversible: true },
    { run: migration036.up, down: migration036.down, metadata: { id: migration036.id, description: migration036.description, version: '0.2.1', date: '2025-11-26' }, reversible: true },
    { run: migration037.up, down: migration037.down, metadata: { id: migration037.id, description: migration037.description, version: '0.2.2', date: '2025-11-27' }, reversible: true },
    { run: migration038.up, down: migration038.down, metadata: { id: migration038.id, description: migration038.description, version: '0.2.3', date: '2025-11-29' }, reversible: true },
    { run: migration039.up, down: migration039.down, metadata: { id: migration039.id, description: migration039.description, version: '0.2.4', date: '2025-11-29' }, reversible: true },
    // Migration 024 removed (was not registered, broken trigger fix)
]

/**
 * Get list of migrations that have already been run
 */
async function getMigrationsRun(db: DatabaseAdapter): Promise<string[]> {
    try {
        const result = await db.get('SELECT config FROM crearis_config WHERE id = 1', [])
        if (!result) {
            return []
        }

        // PostgreSQL returns JSONB as object, SQLite as string
        const config = typeof (result as any).config === 'string'
            ? JSON.parse((result as any).config)
            : (result as any).config

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
            // PostgreSQL returns JSONB as object, SQLite as string
            const config = typeof (result as any).config === 'string'
                ? JSON.parse((result as any).config)
                : (result as any).config
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
    // Read environment variables for package filtering
    const startPackage = process.env.DB_MIGRATION_STARTWITH
    const endPackage = process.env.DB_MIGRATION_ENDWITH

    if (verbose) {
        console.log('\n🔄 Starting database migrations...\n')

        if (startPackage || endPackage) {
            const range = getMigrationPackageRange(startPackage, endPackage)
            if (range) {
                console.log(`🎯 Running migrations package ${startPackage || 'A'} to ${endPackage || 'E'}`)
                console.log(`   Range: ${range.start.toString().padStart(3, '0')} - ${range.end.toString().padStart(3, '0')}\n`)
            } else {
                console.error(`❌ Invalid package range: ${startPackage}-${endPackage}`)
                throw new Error('Invalid migration package range')
            }
        }
    }

    const migrationsRun = await getMigrationsRun(db)
    const runManualMigrations = process.env.RUN_MANUAL_MIGRATIONS === 'true'

    // Filter migrations by package if specified
    let migrationsToRun = migrations
    if (startPackage || endPackage) {
        const beforeFilter = migrationsToRun.length
        migrationsToRun = filterMigrationsByPackage(migrationsToRun, startPackage, endPackage)
        if (verbose) {
            console.log(`   Filtered ${beforeFilter} → ${migrationsToRun.length} migrations\n`)
        }
    }

    let ranCount = 0

    for (const migration of migrationsToRun) {
        if (migrationsRun.includes(migration.metadata.id)) {
            if (verbose) {
                console.log(`⏭️  Skipping migration: ${migration.metadata.id} (already run)`)
            }
            continue
        }

        // Skip manual-only migrations unless explicitly enabled
        if (migration.manualOnly && !runManualMigrations) {
            if (verbose) {
                console.log(`⏸️  Skipping manual migration: ${migration.metadata.id} (set RUN_MANUAL_MIGRATIONS=true to run)`)
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

/**
 * Mark a migration as not run (for rollback)
 */
async function unmarkMigrationRun(db: DatabaseAdapter, migrationId: string) {
    try {
        const isPostgres = db.type === 'postgresql'
        const migrationsRun = await getMigrationsRun(db)

        const index = migrationsRun.indexOf(migrationId)
        if (index > -1) {
            migrationsRun.splice(index, 1)
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
            // PostgreSQL returns JSONB as object, SQLite as string
            const config = typeof (result as any).config === 'string'
                ? JSON.parse((result as any).config)
                : (result as any).config
            config.migrations_run = migrationsRun

            await db.run(
                'UPDATE crearis_config SET config = ? WHERE id = 1',
                [JSON.stringify(config)]
            )
        }
    } catch (error: any) {
        console.error(`Failed to unmark migration ${migrationId}:`, error)
        throw error
    }
}

/**
 * Rollback the last N migrations
 * 
 * @param db Database adapter
 * @param count Number of migrations to rollback (default: 1)
 * @param verbose Show detailed output
 */
export async function rollbackMigrations(db: DatabaseAdapter, count = 1, verbose = true) {
    if (verbose) {
        console.log(`\n🔙 Starting migration rollback (${count} migration(s))...\n`)
    }

    const migrationsRun = await getMigrationsRun(db)

    if (migrationsRun.length === 0) {
        console.log('ℹ️  No migrations to rollback')
        return { rolledBack: 0, skipped: 0 }
    }

    // Get the last N migrations that were run, in reverse order
    const toRollback = migrationsRun.slice(-count).reverse()
    let rolledBackCount = 0
    let skippedCount = 0

    for (const migrationId of toRollback) {
        // Find migration in registry
        const migration = migrations.find(m => m.metadata.id === migrationId)

        if (!migration) {
            console.log(`⚠️  Migration not found in registry: ${migrationId} (skipping)`)
            skippedCount++
            continue
        }

        if (!migration.down) {
            console.log(`⚠️  Migration has no down() function: ${migrationId} (skipping)`)
            console.log(`   This migration is not reversible`)
            skippedCount++
            continue
        }

        if (verbose) {
            console.log(`\n🔄 Rolling back: ${migration.metadata.id}`)
            console.log(`   Description: ${migration.metadata.description}`)
        }

        try {
            await migration.down(db)
            await unmarkMigrationRun(db, migrationId)
            rolledBackCount++

            if (verbose) {
                console.log(`✅ Rolled back: ${migration.metadata.id}`)
            }
        } catch (error) {
            console.error(`\n❌ Rollback failed: ${migration.metadata.id}`)
            console.error(error)
            console.error(`\n⚠️  Database may be in inconsistent state!`)
            console.error(`   Manual intervention may be required`)
            throw error
        }
    }

    if (verbose) {
        console.log(`\n✅ Rollback complete: ${rolledBackCount} migration(s) rolled back, ${skippedCount} skipped`)
        console.log(`📊 Migrations remaining: ${migrationsRun.length - rolledBackCount}\n`)
    }

    return { rolledBack: rolledBackCount, skipped: skippedCount }
}

/**
 * Rollback to a specific migration (rolls back all migrations after it)
 * 
 * @param db Database adapter
 * @param targetMigrationId Migration ID to rollback to (this migration stays, all after it are rolled back)
 * @param verbose Show detailed output
 */
export async function rollbackToMigration(db: DatabaseAdapter, targetMigrationId: string, verbose = true) {
    if (verbose) {
        console.log(`\n🔙 Rolling back to migration: ${targetMigrationId}\n`)
    }

    const migrationsRun = await getMigrationsRun(db)
    const targetIndex = migrationsRun.indexOf(targetMigrationId)

    if (targetIndex === -1) {
        throw new Error(`Migration ${targetMigrationId} has not been run yet`)
    }

    // Calculate how many migrations to rollback
    const count = migrationsRun.length - targetIndex - 1

    if (count === 0) {
        console.log(`ℹ️  Already at migration ${targetMigrationId}`)
        return { rolledBack: 0, skipped: 0 }
    }

    console.log(`   Will rollback ${count} migration(s)\n`)
    return await rollbackMigrations(db, count, verbose)
}

