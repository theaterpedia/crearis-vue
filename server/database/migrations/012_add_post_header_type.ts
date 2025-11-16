/**
 * Migration 012: Add header_type column to posts table
 * 
 * Changes:
 * - Add header_type column with options: default | simple | columns | banner | cover | bauchbinde
 * - Default value: 'default'
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '012_add_post_header_type',
    description: 'Add header_type column to posts table',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 012: Add header_type column to posts...')

        if (isPostgres) {
            // PostgreSQL: Add column with CHECK constraint
            await db.exec(`
                ALTER TABLE posts 
                ADD COLUMN IF NOT EXISTS header_type TEXT DEFAULT 'default'
                CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'))
            `)
            console.log('  ✅ Added header_type column to posts (PostgreSQL)')
        } else {
            // SQLite: Add column (CHECK constraint in column definition)
            try {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD COLUMN header_type TEXT DEFAULT 'default' 
                    CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'))
                `)
                console.log('  ✅ Added header_type column to posts (SQLite)')
            } catch (e: any) {
                if (e.message?.includes('duplicate column')) {
                    console.log('  ⏭️  Column header_type already exists')
                } else {
                    throw e
                }
            }
        }
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 012: Remove header_type column...')

        if (isPostgres) {
            await db.exec(`ALTER TABLE posts DROP COLUMN IF EXISTS header_type`)
        } else {
            // SQLite doesn't support DROP COLUMN easily
            console.log('  ⚠️  SQLite does not support DROP COLUMN - manual intervention required')
        }

        console.log('  ✅ Rolled back header_type column')
    }
}

export default migration
