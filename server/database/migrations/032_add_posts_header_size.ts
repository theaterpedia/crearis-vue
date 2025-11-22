import type { DatabaseAdapter } from '../init'

export async function up(db: DatabaseAdapter): Promise<void> {
    console.log('Running migration 032: Add header_size column to posts table')
    
    await db.run(`
        ALTER TABLE posts 
        ADD COLUMN IF NOT EXISTS header_size TEXT;
    `)
    
    console.log('✓ Migration 032 completed')
}

export async function down(db: DatabaseAdapter): Promise<void> {
    console.log('Rolling back migration 032')
    
    await db.run(`
        ALTER TABLE posts 
        DROP COLUMN IF EXISTS header_size;
    `)
    
    console.log('✓ Migration 032 rolled back')
}
