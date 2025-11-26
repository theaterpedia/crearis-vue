import type { DatabaseAdapter } from '../init'

export async function up(db: DatabaseAdapter): Promise<void> {
    console.log('Running migration 033: Add sysreg tag columns to posts table')
    
    await db.run(`
        ALTER TABLE posts 
        ADD COLUMN IF NOT EXISTS ttags BYTEA DEFAULT E'\\\\x00',
        ADD COLUMN IF NOT EXISTS ctags BYTEA DEFAULT E'\\\\x00',
        ADD COLUMN IF NOT EXISTS dtags BYTEA DEFAULT E'\\\\x00';
    `)
    
    console.log('✓ Migration 033 completed')
}

export async function down(db: DatabaseAdapter): Promise<void> {
    console.log('Rolling back migration 033')
    
    await db.run(`
        ALTER TABLE posts 
        DROP COLUMN IF EXISTS ttags,
        DROP COLUMN IF EXISTS ctags,
        DROP COLUMN IF EXISTS dtags;
    `)
    
    console.log('✓ Migration 033 rolled back')
}
