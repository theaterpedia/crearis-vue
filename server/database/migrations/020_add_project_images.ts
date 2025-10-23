/**
 * Migration 020: Schema placeholder
 * 
 * This migration previously contained project image assignment logic.
 * All image assignment has been moved to migration 023.
 * 
 * This migration is kept as a placeholder to maintain migration numbering.
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '020_add_project_images',
    description: 'Schema placeholder (image assignment moved to migration 023)',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 020: Schema placeholder...')
        console.log('  ℹ️  No schema changes in this migration')
        console.log('  ℹ️  Project image assignment has been moved to migration 023')
        console.log('✅ Migration 020 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 020 down: No changes to revert')
        console.log('✅ Migration 020 reverted')
    }
}

