/**
 * Migration 020: Refactor Entities
 * 
 * Reserved for future entity refactoring and restructuring.
 * 
 * This migration is kept as a placeholder to maintain migration numbering.
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '020_refactor_entities',
    description: 'Refactor entity structure (schema placeholder)',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 020: Refactor entities...')
        console.log('  ℹ️  No schema changes in this migration yet')
        console.log('  ℹ️  Reserved for future entity refactoring')
        console.log('✅ Migration 020 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 020 down: No changes to revert')
        console.log('✅ Migration 020 reverted')
    }
}

export default migration
