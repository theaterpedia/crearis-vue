/**
 * Migration 014: Add computed columns and seed special projects
 * 
 * Changes:
 * - Drop is_regio boolean column (replace with computed column)
 * - Add is_regio as GENERATED ALWAYS AS (type = 'regio') STORED
 * - Add is_project as GENERATED ALWAYS AS (type = 'project') STORED
 * - Seed special projects: 'tp' (special) and 'regio1' (regio)
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '014_add_computed_columns_and_seed',
    description: 'Add computed columns is_regio, is_project and seed special projects',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 014: Add computed columns and seed special projects...')

        if (isPostgres) {
            // 1. Drop existing is_regio column
            console.log('  - Dropping old is_regio column...')
            await db.exec(`
                ALTER TABLE projects 
                DROP COLUMN IF EXISTS is_regio
            `)

            // 2. Add is_regio as computed column
            console.log('  - Adding is_regio as computed column...')
            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN is_regio BOOLEAN 
                GENERATED ALWAYS AS (type = 'regio') STORED
            `)

            // 3. Add is_project as computed column
            console.log('  - Adding is_project as computed column...')
            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS is_project BOOLEAN 
                GENERATED ALWAYS AS (type = 'project') STORED
            `)

            // 4. Seed special projects
            console.log('  - Seeding special projects...')

            // Check if 'tp' project exists
            const tpExists = await db.get(
                'SELECT id FROM projects WHERE id = $1',
                ['tp']
            )

            if (!tpExists) {
                console.log('    → Creating tp project (special)...')
                await db.exec(`
                    INSERT INTO projects (
                        id, heading, type, description, status
                    ) VALUES (
                        'tp', 'Project Overline **tp**', 'special', 'default-page', 'active'
                    )
                `)
            } else {
                console.log('    ℹ️  tp project already exists')
            }

            // Check if 'regio1' project exists
            const regio1Exists = await db.get(
                'SELECT id FROM projects WHERE id = $1',
                ['regio1']
            )

            if (!regio1Exists) {
                console.log('    → Creating regio1 project (regio)...')
                await db.exec(`
                    INSERT INTO projects (
                        id, heading, type, description, status
                    ) VALUES (
                        'regio1', 'Project Overline **regio1**', 'regio', 'default-regio', 'active'
                    )
                `)
            } else {
                console.log('    ℹ️  regio1 project already exists')
            }

        } else {
            // SQLite
            console.log('  ⚠️  SQLite: GENERATED columns require SQLite 3.31+')

            // Drop old is_regio
            console.log('  - Note: SQLite cannot drop columns easily, skipping is_regio drop')

            // Try to add computed columns (requires SQLite 3.31+)
            try {
                await db.exec(`
                    ALTER TABLE projects 
                    ADD COLUMN is_regio BOOLEAN 
                    GENERATED ALWAYS AS (type = 'regio') STORED
                `)
                await db.exec(`
                    ALTER TABLE projects 
                    ADD COLUMN is_project BOOLEAN 
                    GENERATED ALWAYS AS (type = 'project') STORED
                `)
            } catch (e: any) {
                console.log('  ⚠️  SQLite: Could not add GENERATED columns:', e.message)
            }

            // Seed projects
            try {
                await db.exec(`
                    INSERT OR IGNORE INTO projects (
                        id, heading, type, description, status
                    ) VALUES 
                    ('tp', 'Project Overline **tp**', 'special', 'default-page', 'active'),
                    ('regio1', 'Project Overline **regio1**', 'regio', 'default-regio', 'active')
                `)
            } catch (e: any) {
                console.log('  ℹ️  SQLite: Projects may already exist')
            }
        }

        console.log('✅ Migration 014 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 014: Remove computed columns and seeded projects...')

        if (isPostgres) {
            // Drop computed columns
            await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS is_project`)
            await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS is_regio`)

            // Re-add is_regio as regular boolean
            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS is_regio BOOLEAN DEFAULT FALSE
            `)

            // Delete seeded projects
            await db.exec(`DELETE FROM projects WHERE id IN ('tp', 'regio1')`)
        } else {
            console.log('  ⚠️  SQLite: Cannot easily roll back column changes')
        }

        console.log('✅ Rolled back migration 014')
    }
}

export default migration
