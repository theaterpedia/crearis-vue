/**
 * Migration 006: Add logic and filter fields to tasks table for watch tasks
 * - logic: defines the watch task type (watchcsv_base, watchdb_base, etc.)
 * - filter: stores the filter configuration (entities_or_all, etc.)
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '006_add_watch_task_fields',
    description: 'Add logic and filter fields to tasks table for watch tasks',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('📋 Running migration 006: Adding logic and filter fields to tasks...')

        if (db.type === 'postgresql') {
            // PostgreSQL syntax
            await db.exec(`
                ALTER TABLE tasks 
                ADD COLUMN IF NOT EXISTS logic TEXT DEFAULT NULL;
                
                ALTER TABLE tasks 
                ADD COLUMN IF NOT EXISTS filter TEXT DEFAULT NULL;
            `)
        } else {
            // SQLite syntax
            await db.exec(`
                ALTER TABLE tasks 
                ADD COLUMN logic TEXT DEFAULT NULL;
            `)

            await db.exec(`
                ALTER TABLE tasks 
                ADD COLUMN filter TEXT DEFAULT NULL;
            `)
        }

        console.log('✅ Migration 006 completed: logic and filter fields added to tasks table')
    }
}
