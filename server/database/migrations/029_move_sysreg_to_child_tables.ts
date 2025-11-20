/**
 * Migration 029: Move Existing Sysreg Records to Child Tables
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Moves existing sysreg records from base table to proper inherited child tables.
 * This enables proper use of PostgreSQL table inheritance.
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 * 
 * Strategy:
 * 1. For each tagfamily (status, config, ctags, ttags, dtags, rtags)
 * 2. INSERT records into corresponding child table (sysreg_status, etc.)
 * 3. DELETE records from base sysreg table (they'll still be visible via inheritance)
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '029_move_sysreg_to_child_tables',
    description: 'Move existing sysreg records to inherited child tables',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 029 requires PostgreSQL (table inheritance)')
        }

        console.log('\n📦 Migration 029: Move Sysreg Records to Child Tables')
        console.log('='.repeat(60))

        // Check what's currently in base table ONLY (not inherited)
        const baseOnlyCount = await db.get(`
            SELECT COUNT(*) as count 
            FROM ONLY sysreg
        `, [])

        console.log(`\n   Found ${(baseOnlyCount as any).count} records in base sysreg table (ONLY)`)

        if ((baseOnlyCount as any).count === 0) {
            console.log('   ℹ️  No records to move - all already in child tables')
            return
        }

        // Get distribution
        const distribution = await db.all(`
            SELECT tagfamily, COUNT(*) as count 
            FROM ONLY sysreg 
            GROUP BY tagfamily 
            ORDER BY tagfamily
        `, [])

        console.log('\n   Distribution in base table:')
        for (const row of distribution as any[]) {
            console.log(`     ${row.tagfamily}: ${row.count} records`)
        }

        // ===================================================================
        // Move records to child tables by tagfamily
        // ===================================================================

        const tagfamilies = ['status', 'config', 'ctags', 'ttags', 'dtags', 'rtags']
        let totalMoved = 0

        for (const tagfamily of tagfamilies) {
            console.log(`\n   📦 Processing ${tagfamily}:`)

            // Check if there are records for this tagfamily
            const count = await db.get(`
                SELECT COUNT(*) as count 
                FROM ONLY sysreg 
                WHERE tagfamily = $1
            `, [tagfamily])

            const recordCount = (count as any).count

            if (recordCount === 0) {
                console.log(`     ℹ️  No records to move`)
                continue
            }

            // Insert into child table
            await db.exec(`
                INSERT INTO sysreg_${tagfamily} 
                SELECT * FROM ONLY sysreg WHERE tagfamily = '${tagfamily}'
            `)

            // Delete from base table
            await db.exec(`
                DELETE FROM ONLY sysreg WHERE tagfamily = '${tagfamily}'
            `)

            console.log(`     ✓ Moved ${recordCount} records to sysreg_${tagfamily}`)
            totalMoved += recordCount
        }

        // ===================================================================
        // Verification
        // ===================================================================

        console.log('\n   📊 Verification:')

        const afterBaseCount = await db.get(`
            SELECT COUNT(*) as count FROM ONLY sysreg
        `, [])

        const afterTotalCount = await db.get(`
            SELECT COUNT(*) as count FROM sysreg
        `, [])

        console.log(`     Base table (ONLY): ${(afterBaseCount as any).count} records`)
        console.log(`     Total (with inheritance): ${(afterTotalCount as any).count} records`)

        // Check child tables
        console.log('\n     Child table counts:')
        for (const tagfamily of tagfamilies) {
            const childCount = await db.get(`
                SELECT COUNT(*) as count FROM sysreg_${tagfamily}
            `, [])
            const count = (childCount as any).count
            if (count > 0) {
                console.log(`       sysreg_${tagfamily}: ${count} records`)
            }
        }

        console.log('\n' + '='.repeat(60))
        console.log(`✅ Migration 029 completed: Moved ${totalMoved} records to child tables`)
        console.log('='.repeat(60))
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('\n⏪ Rolling back Migration 029: Move records back to base table')

        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 029 rollback requires PostgreSQL')
        }

        const tagfamilies = ['status', 'config', 'ctags', 'ttags', 'dtags', 'rtags']

        // Move all records back to base table
        for (const tagfamily of tagfamilies) {
            // Insert back into base table
            await db.exec(`
                INSERT INTO ONLY sysreg 
                SELECT * FROM sysreg_${tagfamily}
            `)

            // Delete from child table
            await db.exec(`
                DELETE FROM sysreg_${tagfamily}
            `)

            console.log(`  ✓ Moved records from sysreg_${tagfamily} back to base table`)
        }

        console.log('✅ Migration 029 rolled back successfully')
    }
}
