import type { Database } from '../types'

/**
 * Migration 065: Add header_size to events table
 * 
 * Adds header_size column (string) to events table for page layout configuration.
 * Values: 'small', 'medium', 'large', or NULL (default)
 * 
 * This aligns events with posts table which already has header_size.
 */
export async function up(db: Database): Promise<void> {
    console.log('[Migration 065] Adding header_size column to events table...')

    // Check if column already exists
    const columns = await db.all(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'header_size'
    `)

    if (columns.length === 0) {
        await db.run(`
            ALTER TABLE events 
            ADD COLUMN header_size VARCHAR(20) DEFAULT NULL
        `)
        console.log('[Migration 065] Added header_size column to events table')
    } else {
        console.log('[Migration 065] header_size column already exists, skipping')
    }

    console.log('[Migration 065] Complete')
}

export async function down(db: Database): Promise<void> {
    console.log('[Migration 065] Removing header_size column from events table...')

    await db.run(`
        ALTER TABLE events 
        DROP COLUMN IF EXISTS header_size
    `)

    console.log('[Migration 065] Rollback complete')
}
