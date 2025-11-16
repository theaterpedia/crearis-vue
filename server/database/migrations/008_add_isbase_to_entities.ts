/**
 * Add isbase Column to Entity Tables (Migration 008)
 * 
 * Extends posts, locations, instructors, and participants tables with isbase column.
 * The isbase column marks records that are part of the base dataset (from CSV).
 * Records with id starting with '_demo.' should have isbase=1.
 */

import type { DatabaseAdapter } from '../adapter'

/**
 * Add isbase column to a specific table
 */
async function addIsbaseColumn(db: DatabaseAdapter, tableName: string) {
    const isPostgres = db.type === 'postgresql'

    console.log(`  📝 Adding ${tableName}.isbase column...`)

    if (isPostgres) {
        await db.run(`
            ALTER TABLE ${tableName} 
            ADD COLUMN IF NOT EXISTS isbase INTEGER DEFAULT 0
        `, [])
    } else {
        // SQLite doesn't have IF NOT EXISTS for ADD COLUMN
        // Check if column exists first
        try {
            await db.run(`ALTER TABLE ${tableName} ADD COLUMN isbase INTEGER DEFAULT 0`, [])
        } catch (error: any) {
            if (!error.message.includes('duplicate column')) {
                throw error
            }
            console.log(`  ⏭️  Column ${tableName}.isbase already exists`)
        }
    }
}

export const migration = {
    id: '008_add_isbase_to_entities',
    description: 'Add isbase column to posts, locations, instructors, and participants tables',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('📦 Running migration: 008_add_isbase_to_entities')

        // Add isbase column to all entity tables
        const tables = ['posts', 'locations', 'instructors', 'participants']

        for (const table of tables) {
            await addIsbaseColumn(db, table)
        }

        console.log('✅ Migration 008_add_isbase_to_entities completed')
    },
    async down(db: DatabaseAdapter): Promise<void> {
        console.log('📦 Reverting migration: 008_add_isbase_to_entities')

        const isPostgres = db.type === 'postgresql'
        const tables = ['posts', 'locations', 'instructors', 'participants']

        for (const table of tables) {
            console.log(`  📝 Dropping ${table}.isbase column...`)
            await db.run(`ALTER TABLE ${table} DROP COLUMN IF EXISTS isbase`, [])
        }

        console.log('✅ Migration 008_add_isbase_to_entities reverted')
    }
}

export const metadata = {
    id: '008_add_isbase_to_entities',
    description: 'Add isbase column to posts, locations, instructors, and participants tables',
    version: '0.0.2',
    date: '2025-10-16',
}
