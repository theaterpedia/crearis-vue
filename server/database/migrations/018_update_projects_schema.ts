/**
 * Migration 018: Update projects schema
 * 
 * Changes:
 * - Alter projects.status_old default to 'new'
 * - Add 'topic' to projects.type allowed values (with description: primary focus on blog-posting and research)
 * - Add is_topic computed column: BOOLEAN GENERATED ALWAYS AS (type = 'topic') STORED
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '018_update_projects_schema',
    description: 'Update projects schema: status_old default, type constraint with topic, is_topic column',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 018: Update projects schema...')

        // 1. Alter projects.status_old default to 'new'
        console.log('  - Updating projects.status_old default value to "new"...')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE projects 
                ALTER COLUMN status_old SET DEFAULT 'new'
            `)
        } else {
            // SQLite doesn't support ALTER COLUMN SET DEFAULT
            console.log('    (SQLite: default will apply to new records only)')
        }

        // 2. Update projects.type constraint to include 'topic'
        // 'topic' = primary focus on blog-posting and research
        console.log('  - Adding "topic" to projects.type constraint...')
        if (isPostgres) {
            // Drop existing constraint
            await db.exec(`
                ALTER TABLE projects 
                DROP CONSTRAINT IF EXISTS projects_type_check
            `)

            // Add new constraint with 'topic'
            await db.exec(`
                ALTER TABLE projects 
                ADD CONSTRAINT projects_type_check 
                CHECK (type IN ('project', 'regio', 'special', 'topic'))
            `)
        } else {
            // SQLite - constraint will be enforced at application level
            console.log('    (SQLite: constraint will be enforced at application level)')
        }

        // 3. Add is_topic computed column
        console.log('  - Adding is_topic computed column...')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS is_topic BOOLEAN 
                GENERATED ALWAYS AS (type = 'topic') STORED
            `)
        } else {
            // SQLite doesn't support GENERATED columns in ALTER TABLE
            console.log('    (SQLite: is_topic will be computed in application layer)')
        }

        console.log('✅ Migration 018 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 018 down: Reverting schema changes...')
        const isPostgres = db.type === 'postgresql'

        // Remove is_topic column
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE projects 
                DROP COLUMN IF EXISTS is_topic
            `)
        }

        // Revert type constraint (remove 'topic')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE projects 
                DROP CONSTRAINT IF EXISTS projects_type_check
            `)
            await db.exec(`
                ALTER TABLE projects 
                ADD CONSTRAINT projects_type_check 
                CHECK (type IN ('project', 'regio', 'special'))
            `)
        }

        // Revert status default to 'draft'
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE projects 
                ALTER COLUMN status SET DEFAULT 'draft'
            `)
        }

        console.log('✅ Migration 018 reverted')
    }
}
