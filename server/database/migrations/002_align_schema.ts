/**
 * Schema Alignment Migration (002)
 * Aligns actual database schema with v0.0.1 schema definition
 * Adds missing columns identified by structure validation
 */

import type { DatabaseAdapter } from '../adapter'

/**
 * Add isBase column to events table
 * Used to mark base/template events
 */
export async function addEventsIsBase(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'

    console.log('  📝 Adding events.isBase column...')

    if (isPostgres) {
        await db.run(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS isBase INTEGER DEFAULT 0
    `, [])
    } else {
        // SQLite doesn't have IF NOT EXISTS for ADD COLUMN
        // Check if column exists first
        try {
            await db.run(`ALTER TABLE events ADD COLUMN isBase INTEGER DEFAULT 0`, [])
        } catch (error: any) {
            if (!error.message.includes('duplicate column')) {
                throw error
            }
            console.log('  ⏭️  Column events.isBase already exists')
        }
    }
}

/**
 * Add release_id, image, and prompt columns to tasks table
 * Extended task metadata for enhanced task management
 */
export async function addTasksColumns(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'

    console.log('  📝 Adding tasks.release_id column...')
    if (isPostgres) {
        await db.run(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS release_id TEXT
    `, [])
    } else {
        try {
            await db.run(`ALTER TABLE tasks ADD COLUMN release_id TEXT`, [])
        } catch (error: any) {
            if (!error.message.includes('duplicate column')) {
                throw error
            }
            console.log('  ⏭️  Column tasks.release_id already exists')
        }
    }

    console.log('  📝 Adding tasks.image column...')
    if (isPostgres) {
        await db.run(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS image TEXT
    `, [])
    } else {
        try {
            await db.run(`ALTER TABLE tasks ADD COLUMN image TEXT`, [])
        } catch (error: any) {
            if (!error.message.includes('duplicate column')) {
                throw error
            }
            console.log('  ⏭️  Column tasks.image already exists')
        }
    }

    console.log('  📝 Adding tasks.prompt column...')
    if (isPostgres) {
        await db.run(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS prompt TEXT
    `, [])
    } else {
        try {
            await db.run(`ALTER TABLE tasks ADD COLUMN prompt TEXT`, [])
        } catch (error: any) {
            if (!error.message.includes('duplicate column')) {
                throw error
            }
            console.log('  ⏭️  Column tasks.prompt already exists')
        }
    }
}

/**
 * Main migration function
 */
export async function runSchemaAlignmentMigration(db: DatabaseAdapter) {
    console.log('📦 Running migration: 002_align_schema')

    await addEventsIsBase(db)
    await addTasksColumns(db)

    console.log('✅ Migration 002_align_schema completed')
}

export const metadata = {
    id: '002_align_schema',
    description: 'Align database schema with v0.0.1 definition - add missing columns',
    version: '0.0.1',
    date: '2025-10-15',
}
