/**
 * Migration 066: Add header_size to posts and pages tables
 * 
 * Context:
 * - Odoo models define header_size for all entities (events, posts, partners)
 * - events table already has header_size (added in migration 065)
 * - posts and pages tables are missing this field
 * 
 * This migration:
 * 1. Adds header_size column to posts table
 * 2. Adds header_size column to pages table
 * 3. Sets default value to 'mini' (matching Odoo default)
 */

import type { DatabaseAdapter } from '../adapter'

export const id = '066_add_header_size_columns'
export const description = 'Add header_size column to posts and pages tables'

export async function up(db: DatabaseAdapter): Promise<void> {
    console.log('  → Adding header_size column to posts table...')

    // Check if column already exists in posts
    const postsColumnExists = await db.get(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'header_size'
    `, [])

    if (!postsColumnExists) {
        await db.exec(`
            ALTER TABLE posts 
            ADD COLUMN header_size VARCHAR(20) DEFAULT 'mini'
        `)
        console.log('    ✓ Added header_size to posts')
    } else {
        console.log('    ⏭️  posts.header_size already exists, skipping')
    }

    console.log('  → Adding header_size column to pages table...')

    // Check if column already exists in pages
    const pagesColumnExists = await db.get(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pages' AND column_name = 'header_size'
    `, [])

    if (!pagesColumnExists) {
        await db.exec(`
            ALTER TABLE pages 
            ADD COLUMN header_size VARCHAR(20) DEFAULT 'mini'
        `)
        console.log('    ✓ Added header_size to pages')
    } else {
        console.log('    ⏭️  pages.header_size already exists, skipping')
    }

    console.log('  ✓ Migration 066 complete')
}

export async function down(db: DatabaseAdapter): Promise<void> {
    console.log('  → Rolling back migration 066...')

    // Remove header_size from posts
    const postsColumnExists = await db.get(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'header_size'
    `, [])

    if (postsColumnExists) {
        await db.exec(`ALTER TABLE posts DROP COLUMN IF EXISTS header_size`)
        console.log('    ✓ Removed header_size from posts')
    }

    // Remove header_size from pages
    const pagesColumnExists = await db.get(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pages' AND column_name = 'header_size'
    `, [])

    if (pagesColumnExists) {
        await db.exec(`ALTER TABLE pages DROP COLUMN IF EXISTS header_size`)
        console.log('    ✓ Removed header_size from pages')
    }

    console.log('  ✓ Rollback complete')
}

export const migration = { id, description, up, down }
