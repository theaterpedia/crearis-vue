import type { DatabaseAdapter } from '../init'

export async function up(db: DatabaseAdapter): Promise<void> {
    console.log('Running migration 034: Add sysreg tag columns to events and images tables')
    
    // Add tag columns to events table
    await db.run(`
        ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS ttags BYTEA DEFAULT E'\\\\x00',
        ADD COLUMN IF NOT EXISTS ctags BYTEA DEFAULT E'\\\\x00',
        ADD COLUMN IF NOT EXISTS dtags BYTEA DEFAULT E'\\\\x00';
    `)
    
    // Add missing tag columns to images table (already has ctags and rtags)
    await db.run(`
        ALTER TABLE images 
        ADD COLUMN IF NOT EXISTS ttags BYTEA DEFAULT E'\\\\x00',
        ADD COLUMN IF NOT EXISTS dtags BYTEA DEFAULT E'\\\\x00';
    `)
    
    console.log('✓ Migration 034 completed')
}

export async function down(db: DatabaseAdapter): Promise<void> {
    console.log('Rolling back migration 034')
    
    await db.run(`
        ALTER TABLE events 
        DROP COLUMN IF EXISTS ttags,
        DROP COLUMN IF EXISTS ctags,
        DROP COLUMN IF EXISTS dtags;
    `)
    
    await db.run(`
        ALTER TABLE images 
        DROP COLUMN IF EXISTS ttags,
        DROP COLUMN IF EXISTS dtags;
    `)
    
    console.log('✓ Migration 034 rolled back')
}
