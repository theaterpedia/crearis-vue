/**
 * Migration 046: Add role visibility columns to entity tables
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Adds r_anonym, r_partner, r_participant, r_member, r_owner boolean columns
 * to posts, images, and projects tables.
 * 
 * Also adds owner_id to posts table (images and projects already have it).
 * 
 * These columns are maintained by triggers (migration 047) based on:
 * - The entity's status field (contains state bits)
 * - The sysreg_config capabilities matrix
 * 
 * Package: D (040-049) - Auth system refactoring
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '046_entity_role_visibility_columns',
    description: 'Add r_anonym, r_partner, r_participant, r_member, r_owner columns to entity tables',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 046 requires PostgreSQL')
        }

        console.log('Running migration 046: Entity role visibility columns...')

        // ===================================================================
        // POSTS TABLE
        // ===================================================================

        // Add owner_id to posts (it only has public_user for display author)
        await db.exec(`
            ALTER TABLE posts 
            ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        `)

        // Add role visibility columns to posts
        await db.exec(`
            ALTER TABLE posts 
            ADD COLUMN IF NOT EXISTS r_anonym BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_partner BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_participant BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_member BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS r_owner BOOLEAN DEFAULT true;
        `)

        // Add index for efficient filtering
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_posts_owner_id ON posts(owner_id);
            CREATE INDEX IF NOT EXISTS idx_posts_visibility 
            ON posts(r_anonym, r_partner, r_participant, r_member, r_owner);
        `)

        // ===================================================================
        // IMAGES TABLE
        // ===================================================================

        // Add role visibility columns to images
        await db.exec(`
            ALTER TABLE images 
            ADD COLUMN IF NOT EXISTS r_anonym BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_partner BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_participant BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_member BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS r_owner BOOLEAN DEFAULT true;
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_images_visibility 
            ON images(r_anonym, r_partner, r_participant, r_member, r_owner);
        `)

        // ===================================================================
        // PROJECTS TABLE
        // ===================================================================

        // Add role visibility columns to projects
        await db.exec(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS r_anonym BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_partner BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_participant BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS r_member BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS r_owner BOOLEAN DEFAULT true;
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_projects_visibility 
            ON projects(r_anonym, r_partner, r_participant, r_member, r_owner);
        `)

        console.log('Migration 046 complete: Role visibility columns added to posts, images, projects')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 046 rollback requires PostgreSQL')
        }

        // Remove indexes
        await db.exec(`DROP INDEX IF EXISTS idx_posts_owner_id;`)
        await db.exec(`DROP INDEX IF EXISTS idx_posts_visibility;`)
        await db.exec(`DROP INDEX IF EXISTS idx_images_visibility;`)
        await db.exec(`DROP INDEX IF EXISTS idx_projects_visibility;`)

        // Remove columns from posts
        await db.exec(`
            ALTER TABLE posts 
            DROP COLUMN IF EXISTS owner_id,
            DROP COLUMN IF EXISTS r_anonym,
            DROP COLUMN IF EXISTS r_partner,
            DROP COLUMN IF EXISTS r_participant,
            DROP COLUMN IF EXISTS r_member,
            DROP COLUMN IF EXISTS r_owner;
        `)

        // Remove columns from images
        await db.exec(`
            ALTER TABLE images 
            DROP COLUMN IF EXISTS r_anonym,
            DROP COLUMN IF EXISTS r_partner,
            DROP COLUMN IF EXISTS r_participant,
            DROP COLUMN IF EXISTS r_member,
            DROP COLUMN IF EXISTS r_owner;
        `)

        // Remove columns from projects
        await db.exec(`
            ALTER TABLE projects 
            DROP COLUMN IF EXISTS r_anonym,
            DROP COLUMN IF EXISTS r_partner,
            DROP COLUMN IF EXISTS r_participant,
            DROP COLUMN IF EXISTS r_member,
            DROP COLUMN IF EXISTS r_owner;
        `)

        console.log('Migration 046 rolled back: Role visibility columns removed')
    }
}
