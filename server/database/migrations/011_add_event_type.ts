/**
 * Migration 011: Add event_type column to events table
 * 
 * Changes:
 * - Add event_type column with options: workshop (default) | project | course | conference | online | meeting
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '011_add_event_type',
    description: 'Add event_type column to events table',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 011: Add event_type column...')

        if (isPostgres) {
            // PostgreSQL: Add column with CHECK constraint
            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'workshop'
                CHECK (event_type IN ('workshop', 'project', 'course', 'conference', 'online', 'meeting'))
            `)
            console.log('  ✅ Added event_type column to events (PostgreSQL)')
        } else {
            // SQLite: Add column (CHECK constraint in column definition)
            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD COLUMN event_type TEXT DEFAULT 'workshop' 
                    CHECK (event_type IN ('workshop', 'project', 'course', 'conference', 'online', 'meeting'))
                `)
                console.log('  ✅ Added event_type column to events (SQLite)')
            } catch (e: any) {
                if (e.message?.includes('duplicate column')) {
                    console.log('  ⏭️  Column event_type already exists')
                } else {
                    throw e
                }
            }
        }
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 011: Remove event_type column...')

        if (isPostgres) {
            await db.exec(`ALTER TABLE events DROP COLUMN IF EXISTS event_type`)
        } else {
            // SQLite doesn't support DROP COLUMN easily
            console.log('  ⚠️  SQLite does not support DROP COLUMN - manual intervention required')
        }

        console.log('  ✅ Rolled back event_type column')
    }
}

export default migration
