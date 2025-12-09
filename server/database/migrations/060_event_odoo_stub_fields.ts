/**
 * Migration 060: Event Stub Fields for Odoo Sync
 * 
 * Adds stub fields to events table in preparation for v0.6:
 * - odoo_xmlid: External ID for Odoo sync
 * - odoo_stats: JSONB cache for registration counts, seats, etc.
 * - confirmed_at: Timestamp when event crossed the "confirmed" barrier
 * 
 * The "confirmed" barrier is a one-way door:
 * - Events below 'confirmed' status are local-only (no Odoo sync)
 * - Once confirmed, event syncs to Odoo and cannot go back (only trash)
 * 
 * @see chat/spec/negative-spec.md - Events System Constraints
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '060_event_odoo_stub_fields',
    description: 'Add Odoo sync stub fields to events table (odoo_xmlid, odoo_stats, confirmed_at)',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('📋 Running migration 060: Adding event Odoo stub fields...')

        if (isPostgres) {
            // Add odoo_xmlid for external ID sync
            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN IF NOT EXISTS odoo_xmlid TEXT
            `)
            console.log('  ✓ Added odoo_xmlid column')

            // Add odoo_stats for cached Odoo data (registration counts, etc.)
            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN IF NOT EXISTS odoo_stats JSONB DEFAULT '{}'::jsonb
            `)
            console.log('  ✓ Added odoo_stats column')

            // Add confirmed_at timestamp for the "one-way door"
            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ
            `)
            console.log('  ✓ Added confirmed_at column')

            // Add index on odoo_xmlid for sync lookups
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_events_odoo_xmlid 
                ON events(odoo_xmlid) 
                WHERE odoo_xmlid IS NOT NULL
            `)
            console.log('  ✓ Added index on odoo_xmlid')

            // Add index on confirmed_at for filtering confirmed events
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_events_confirmed_at 
                ON events(confirmed_at) 
                WHERE confirmed_at IS NOT NULL
            `)
            console.log('  ✓ Added index on confirmed_at')

        } else {
            // SQLite version
            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN odoo_xmlid TEXT
            `)

            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN odoo_stats TEXT DEFAULT '{}'
            `)

            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN confirmed_at TEXT
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_events_odoo_xmlid 
                ON events(odoo_xmlid)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_events_confirmed_at 
                ON events(confirmed_at)
            `)
        }

        console.log('✅ Migration 060 complete: Event Odoo stub fields added')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('🔄 Rolling back migration 060: Removing event Odoo stub fields...')

        if (isPostgres) {
            await db.exec('DROP INDEX IF EXISTS idx_events_confirmed_at')
            await db.exec('DROP INDEX IF EXISTS idx_events_odoo_xmlid')
            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS confirmed_at')
            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS odoo_stats')
            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS odoo_xmlid')
        } else {
            // SQLite doesn't support DROP COLUMN easily - would need table rebuild
            console.log('  ⚠️ SQLite rollback not implemented - columns remain')
        }

        console.log('✅ Migration 060 rollback complete')
    }
}
