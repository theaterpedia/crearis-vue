/**
 * Migration Template for Package C (022-029)
 * 
 * Package C: Alpha features with reversible migrations
 * - Use this template for migrations 022-029
 * - Always implement both up() and down() functions
 * - Test rollback before committing
 * 
 * Copy this file to create new migrations:
 *   cp 022_template.ts 022_your_feature.ts
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '022_template',  // Change to actual migration ID
    description: 'Template for reversible migrations',  // Describe what this migration does

    /**
     * Apply the migration (forward)
     * 
     * Guidelines:
     * - Add tables, columns, indexes
     * - Create triggers, functions
     * - Insert system data (with ON CONFLICT DO NOTHING)
     * - Never drop existing data
     */
    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'
        console.log('Running migration 022_template: YOUR_DESCRIPTION_HERE')

        try {
            // Example: Add a new column
            await db.run(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS your_column TEXT DEFAULT ''
            `)

            console.log('  ✓ Added your_column to projects table')

            // Example: Create an index
            if (isPostgres) {
                await db.run(`
                    CREATE INDEX IF NOT EXISTS idx_projects_your_column 
                    ON projects(your_column)
                `)
                console.log('  ✓ Created index on your_column')
            }

            // Example: Insert system data
            await db.run(`
                INSERT INTO status (id, code, label) 
                VALUES (99, 'your_status', 'Your Status')
                ON CONFLICT (id) DO NOTHING
            `)

            console.log('  ✓ Inserted system data')

            console.log('✓ Migration 022_template completed')
        } catch (error) {
            console.error('✗ Migration 022_template failed:', error)
            throw error
        }
    },

    /**
     * Rollback the migration (backward)
     * 
     * Guidelines:
     * - Reverse the changes made in up()
     * - Drop added tables, columns, indexes
     * - Remove inserted data (if safe)
     * - Leave existing data intact
     * - Use IF EXISTS to avoid errors
     * 
     * Note: Some operations may not be perfectly reversible
     * (e.g., dropping columns loses data). Document any
     * non-reversible operations in comments.
     */
    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'
        console.log('Rolling back migration 022_template')

        try {
            // Remove system data (if it won't break existing records)
            await db.run(`
                DELETE FROM status 
                WHERE id = 99 AND code = 'your_status'
            `)
            console.log('  ✓ Removed system data')

            // Drop index
            if (isPostgres) {
                await db.run(`
                    DROP INDEX IF EXISTS idx_projects_your_column
                `)
                console.log('  ✓ Dropped index')
            }

            // Drop column
            // WARNING: This will lose data in the column!
            await db.run(`
                ALTER TABLE projects 
                DROP COLUMN IF EXISTS your_column
            `)
            console.log('  ✓ Removed your_column from projects table')

            console.log('✓ Migration 022_template rolled back')
        } catch (error) {
            console.error('✗ Rollback 022_template failed:', error)
            throw error
        }
    }
}

/**
 * TESTING YOUR MIGRATION
 * 
 * 1. Test forward migration:
 *    pnpm db:migrate
 * 
 * 2. Verify changes in database:
 *    psql -d your_database -c "\d projects"
 * 
 * 3. Test rollback:
 *    pnpm db:rollback --force
 * 
 * 4. Verify rollback worked:
 *    psql -d your_database -c "\d projects"
 * 
 * 5. Re-run forward migration:
 *    pnpm db:migrate
 * 
 * 6. Test with data:
 *    - Insert test data
 *    - Run rollback
 *    - Verify data handling
 */

/**
 * NON-REVERSIBLE OPERATIONS
 * 
 * Some operations cannot be perfectly reversed:
 * 
 * 1. Dropping columns - DATA LOSS
 *    - Document which columns will lose data
 *    - Consider backing up data first
 * 
 * 2. Changing column types - POTENTIAL DATA LOSS
 *    - May truncate or transform data
 *    - Test with production-like data
 * 
 * 3. Deleting records - DATA LOSS
 *    - Only delete system/seed data
 *    - Never delete user-generated data
 * 
 * 4. Renaming columns/tables - BREAKS CODE
 *    - Update all code references first
 *    - Use multi-step migrations (add new, migrate data, remove old)
 * 
 * Document all non-reversible operations in comments!
 */
