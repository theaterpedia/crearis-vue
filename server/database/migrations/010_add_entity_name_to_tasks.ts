/**
 * Migration 010: Add entity_name field to tasks table
 * 
 * Purpose: Store human-readable entity names for admin watch tasks and main tasks
 * 
 * Context:
 * - Admin watch tasks need to display the entity type they're watching (e.g., "CSV Files", "Database Entities")
 * - Main tasks can use this field to cache the entity name from joined tables
 * - Currently, entity_name is computed dynamically via SQL joins, but storing it allows:
 *   1. Faster queries without joins
 *   2. Consistent display even if entity is deleted
 *   3. Explicit tracking for admin tasks
 * 
 * Related: ENTITY_NAME_FIELD_REMOVAL.md - This migration addresses the temporary removal
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '010_add_entity_name_to_tasks',
    description: 'Add entity_name field to tasks table for admin watch tasks and main tasks',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('📋 Running migration 010: Adding entity_name field to tasks...')

        if (db.type === 'postgresql') {
            // PostgreSQL syntax
            await db.exec(`
                ALTER TABLE tasks 
                ADD COLUMN IF NOT EXISTS entity_name TEXT DEFAULT NULL;
            `)

            console.log('  ✓ Added entity_name column (PostgreSQL)')
        } else {
            // SQLite syntax
            await db.exec(`
                ALTER TABLE tasks 
                ADD COLUMN entity_name TEXT DEFAULT NULL;
            `)

            console.log('  ✓ Added entity_name column (SQLite)')
        }

        console.log('✅ Migration 010 completed: entity_name field added to tasks table')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('📋 Rolling back migration 010: Removing entity_name field from tasks...')

        if (db.type === 'postgresql') {
            // PostgreSQL syntax
            await db.exec(`
                ALTER TABLE tasks 
                DROP COLUMN IF EXISTS entity_name;
            `)
        } else {
            // SQLite doesn't support DROP COLUMN easily, would need table recreation
            // For now, we'll just log a warning
            console.warn('⚠️  SQLite does not support DROP COLUMN. Manual intervention required.')
            throw new Error('SQLite rollback not implemented. Please recreate the table manually.')
        }

        console.log('✅ Migration 010 rollback completed')
    }
}
