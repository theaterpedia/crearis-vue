/**
 * Migration 019: Schema placeholder
 * 
 * This migration previously contained demo data seeding.
 * All seeding has been moved to migration 023.
 * 
 * This migration is kept as a placeholder to maintain migration numbering.
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '019_reseed_users_and_projects',
    description: 'Schema placeholder (seeding moved to migration 023)',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 019: Schema placeholder...')
        console.log('  ℹ️  No schema changes in this migration')
        console.log('  ℹ️  Demo data seeding has been moved to migration 023')
        console.log('✅ Migration 019 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 019 down: No changes to revert')
        console.log('✅ Migration 019 reverted')
    }
}
