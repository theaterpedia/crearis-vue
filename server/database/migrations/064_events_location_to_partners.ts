import type { DatabaseAdapter } from '../adapters/types'

/**
 * Migration 064: Remap events.location FK from locations to partners
 * 
 * The events.location field currently references the old `locations` table,
 * but locations are now stored in the unified `partners` table with 
 * partner_types & 2 = 2 (location bit).
 * 
 * This migration:
 * 1. Drops the old FK constraint events_location_fkey1 -> locations(id)
 * 2. Creates a new FK constraint events_location_fkey -> partners(id)
 */
export const migration = {
    version: 64,
    name: '064_events_location_to_partners',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('🔄 Migration 064: Remapping events.location FK from locations to partners')

        // Step 1: Drop old FK constraint to locations table
        console.log('  Step 1: Dropping old FK constraint events_location_fkey1...')
        await db.run(`
            ALTER TABLE events 
            DROP CONSTRAINT IF EXISTS events_location_fkey1
        `)
        console.log('  ✓ Dropped events_location_fkey1')

        // Also drop any other location FK variants that might exist
        await db.run(`
            ALTER TABLE events 
            DROP CONSTRAINT IF EXISTS events_location_fkey
        `)

        // Step 2: Clear invalid location references (locations that don't exist in partners)
        console.log('  Step 2: Clearing invalid location references...')
        const invalidCount = await db.get(`
            SELECT COUNT(*) as count FROM events 
            WHERE location IS NOT NULL 
            AND location NOT IN (SELECT id FROM partners WHERE partner_types & 2 = 2)
        `) as { count: number }

        if (invalidCount?.count > 0) {
            console.log(`  ⚠️  Found ${invalidCount.count} events with invalid location references, setting to NULL`)
            await db.run(`
                UPDATE events 
                SET location = NULL 
                WHERE location IS NOT NULL 
                AND location NOT IN (SELECT id FROM partners WHERE partner_types & 2 = 2)
            `)
        }

        // Step 3: Create new FK constraint to partners table
        console.log('  Step 3: Creating new FK constraint to partners...')
        await db.run(`
            ALTER TABLE events 
            ADD CONSTRAINT events_location_fkey 
            FOREIGN KEY (location) REFERENCES partners(id) ON DELETE SET NULL
        `)
        console.log('  ✓ Created events_location_fkey -> partners(id)')

        // Step 4: Create index for location lookups
        console.log('  Step 4: Creating index on events.location...')
        await db.run(`
            CREATE INDEX IF NOT EXISTS idx_events_location ON events(location)
        `)
        console.log('  ✓ Created idx_events_location')

        console.log('✅ Migration 064 complete: events.location now references partners table')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('🔄 Rollback Migration 064: Reverting events.location FK to locations')

        // Drop the new FK to partners
        await db.run(`
            ALTER TABLE events 
            DROP CONSTRAINT IF EXISTS events_location_fkey
        `)

        // Drop index
        await db.run(`
            DROP INDEX IF EXISTS idx_events_location
        `)

        // Recreate old FK to locations (if locations table still exists)
        try {
            await db.run(`
                ALTER TABLE events 
                ADD CONSTRAINT events_location_fkey1 
                FOREIGN KEY (location) REFERENCES locations(id) ON DELETE SET NULL
            `)
            console.log('✓ Restored events_location_fkey1 -> locations(id)')
        } catch (error) {
            console.log('⚠️  Could not restore FK to locations table (may not exist)')
        }

        console.log('✅ Rollback complete')
    }
}
