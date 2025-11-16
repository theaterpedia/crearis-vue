/**
 * Migration 016: Users Email Format
 * 
 * NOTE: This migration is now handled by Migration 019 Chapter 2
 * Migration 019 Chapter 2 migrates users from TEXT id to auto-increment INTEGER id
 * and updates all foreign key references.
 * 
 * This migration is kept as a no-op for migration history tracking.
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '016_users_email_format',
    description: 'Enforce email format for users.id and migrate existing user IDs',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 016: Users email format...')
        console.log('  ℹ️  This migration is now handled by Migration 019 Chapter 2')
        console.log('  ℹ️  Migration 019 Chapter 2 migrates users to auto-increment INTEGER IDs')
        console.log('\n✅ Migration 016 completed (no-op)')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 016: Users email format...')
        console.log('  ℹ️  No action needed (this is a no-op migration)')
        console.log('✅ Rollback complete')
    }
}
