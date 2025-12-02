/**
 * Migration 045: Add configrole to project_members
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Adds integer configrole column that maps directly to role bits (25-29):
 * - 2 = partner (bit 26)
 * - 4 = participant (bit 27)
 * - 8 = member (bit 28)
 * 
 * This enables efficient trigger lookups without string casting.
 * 
 * Package: D (040-049) - Auth system refactoring
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '045_project_members_configrole',
    description: 'Add configrole integer column to project_members for efficient trigger lookups',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 045 requires PostgreSQL')
        }

        console.log('Running migration 045: project_members configrole...')

        // Add configrole column
        await db.exec(`
            ALTER TABLE project_members 
            ADD COLUMN IF NOT EXISTS configrole INTEGER;
        `)

        // Backfill from existing role text
        // Role bit values: partner=2, participant=4, member=8
        await db.exec(`
            UPDATE project_members SET configrole = CASE
                WHEN role = 'partner' THEN 2
                WHEN role = 'participant' THEN 4
                WHEN role = 'member' THEN 8
                WHEN role = 'owner' THEN 8  -- project-owner treated as member on records
                ELSE 8  -- default to member
            END
            WHERE configrole IS NULL;
        `)

        // Set NOT NULL and default after backfill
        await db.exec(`
            ALTER TABLE project_members 
            ALTER COLUMN configrole SET NOT NULL;
        `)

        await db.exec(`
            ALTER TABLE project_members 
            ALTER COLUMN configrole SET DEFAULT 8;
        `)

        // Add index for efficient lookups
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_project_members_configrole 
            ON project_members(configrole);
        `)

        console.log('Migration 045 complete: configrole column added to project_members')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 045 rollback requires PostgreSQL')
        }

        await db.exec(`DROP INDEX IF EXISTS idx_project_members_configrole;`)
        await db.exec(`ALTER TABLE project_members DROP COLUMN IF EXISTS configrole;`)

        console.log('Migration 045 rolled back: configrole column removed')
    }
}
