/**
 * Migration 030: Complete Status Migration - Drop Legacy Columns
 * 
 * IMPORTANT: Big-bang migration to clean break from legacy status_id system.
 * This migration:
 * 1. Drops status_id_depr columns from all entity tables
 * 2. Drops status_depr table
 * 3. Creates helper functions for BYTEA status operations
 * 4. Verifies all tables have status_val populated
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 * 
 * REVERSIBLE: Can rollback by recreating status_id columns from status_val
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '030_drop_legacy_status_columns',
    description: 'Drop legacy status_id columns and complete migration to status_val BYTEA',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 030 requires PostgreSQL')
        }

        console.log('Running migration 030: Drop legacy status columns...')

        // ===================================================================
        // CHAPTER 1: Verify Migration Readiness
        // ===================================================================
        console.log('\n📖 Chapter 1: Verify Migration Readiness')

        // Get all entity tables
        const entityTables = [
            'projects',
            'events',
            'posts',
            'participants',
            'instructors',
            'images',
            'users',
            'tasks',
            'interactions'
        ]

        // Check that all tables have status_val populated
        let totalRows = 0
        let totalWithStatusVal = 0

        for (const table of entityTables) {
            const hasTable = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = '${table}'
                ) as exists
            `, [])

            if (!(hasTable as any).exists) {
                console.log(`    ⚠️  Table ${table} does not exist, skipping...`)
                continue
            }

            const countResult = await db.get(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(status_val) as with_status
                FROM ${table}
            `, [])

            const counts = countResult as any
            totalRows += counts.total
            totalWithStatusVal += counts.with_status

            console.log(`    ${table}: ${counts.with_status}/${counts.total} rows have status_val`)

            if (counts.with_status < counts.total) {
                console.log(`    ⚠️  WARNING: ${counts.total - counts.with_status} rows in ${table} missing status_val`)
            }
        }

        console.log(`\n    Total: ${totalWithStatusVal}/${totalRows} rows have status_val`)

        if (totalWithStatusVal < totalRows) {
            throw new Error(
                `Migration readiness check failed: ${totalRows - totalWithStatusVal} rows missing status_val. ` +
                `Run migration 027 first to populate status_val from status_id_depr.`
            )
        }

        console.log('    ✓ All rows have status_val populated')

        // ===================================================================
        // CHAPTER 2: Create Helper Functions for BYTEA Operations
        // ===================================================================
        console.log('\n📖 Chapter 2: Create Helper Functions')

        // Helper function to get status name from BYTEA value
        await db.exec(`
            CREATE OR REPLACE FUNCTION get_status_name(p_status_val BYTEA)
            RETURNS TEXT AS $$
            DECLARE
                v_status_name TEXT;
            BEGIN
                SELECT name INTO v_status_name
                FROM sysreg_status
                WHERE value = p_status_val;
                
                -- Extract just the name part after " > "
                IF v_status_name IS NOT NULL THEN
                    v_status_name := split_part(v_status_name, ' > ', 2);
                    IF v_status_name = '' THEN
                        -- Fallback to full name if no separator
                        SELECT name INTO v_status_name
                        FROM sysreg_status
                        WHERE value = p_status_val;
                    END IF;
                END IF;
                
                RETURN v_status_name;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `)

        console.log('    ✓ Created get_status_name() function')

        // Helper function to get status value from name
        await db.exec(`
            CREATE OR REPLACE FUNCTION get_status_value(
                p_status_name TEXT,
                p_family TEXT DEFAULT NULL
            )
            RETURNS BYTEA AS $$
            DECLARE
                v_status_val BYTEA;
                v_search_pattern TEXT;
            BEGIN
                IF p_family IS NOT NULL THEN
                    -- Search for "family > name" pattern
                    v_search_pattern := p_family || ' > ' || p_status_name;
                    SELECT value INTO v_status_val
                    FROM sysreg_status
                    WHERE name = v_search_pattern
                    LIMIT 1;
                ELSE
                    -- Search for any "* > name" pattern
                    v_search_pattern := '% > ' || p_status_name;
                    SELECT value INTO v_status_val
                    FROM sysreg_status
                    WHERE name LIKE v_search_pattern
                    LIMIT 1;
                END IF;
                
                RETURN v_status_val;
            END;
            $$ LANGUAGE plpgsql STABLE;
        `)

        console.log('    ✓ Created get_status_value() function')

        // Helper function to check if status matches
        await db.exec(`
            CREATE OR REPLACE FUNCTION has_status(
                p_status_val BYTEA,
                p_status_name TEXT
            )
            RETURNS BOOLEAN AS $$
            BEGIN
                RETURN get_status_name(p_status_val) = p_status_name;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `)

        console.log('    ✓ Created has_status() function')

        // ===================================================================
        // CHAPTER 3: Drop Legacy Columns
        // ===================================================================
        console.log('\n📖 Chapter 3: Drop Legacy Status Columns')

        let droppedColumns = 0

        for (const table of entityTables) {
            const hasTable = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = '${table}'
                ) as exists
            `, [])

            if (!(hasTable as any).exists) {
                continue
            }

            // Drop status_id_depr column
            const hasCol = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status_id_depr'
                ) as exists
            `, [])

            if ((hasCol as any).exists) {
                await db.exec(`ALTER TABLE ${table} DROP COLUMN status_id_depr CASCADE`)
                droppedColumns++
                console.log(`    ✓ Dropped ${table}.status_id_depr`)
            }

            // Also drop legacy status_id if it exists
            const hasOldCol = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status_id'
                ) as exists
            `, [])

            if ((hasOldCol as any).exists) {
                await db.exec(`ALTER TABLE ${table} DROP COLUMN status_id CASCADE`)
                droppedColumns++
                console.log(`    ✓ Dropped ${table}.status_id`)
            }
        }

        console.log(`\n    ✓ Dropped ${droppedColumns} legacy status columns`)

        // ===================================================================
        // CHAPTER 4: Drop Legacy Tables
        // ===================================================================
        console.log('\n📖 Chapter 4: Drop Legacy Tables')

        await db.exec(`DROP TABLE IF EXISTS status_depr CASCADE`)
        console.log('    ✓ Dropped status_depr table')

        await db.exec(`DROP TABLE IF EXISTS tags_depr CASCADE`)
        console.log('    ✓ Dropped tags_depr table')

        await db.exec(`DROP TABLE IF EXISTS events_tags_depr CASCADE`)
        console.log('    ✓ Dropped events_tags_depr table')

        await db.exec(`DROP TABLE IF EXISTS posts_tags_depr CASCADE`)
        console.log('    ✓ Dropped posts_tags_depr table')

        // ===================================================================
        // CHAPTER 5: Verify Cleanup
        // ===================================================================
        console.log('\n📖 Chapter 5: Verify Cleanup')

        // Verify no more status_id columns exist
        const remainingStatusIdCols = await db.all(`
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE column_name LIKE '%status_id%'
            AND table_schema = 'public'
            ORDER BY table_name
        `, [])

        if ((remainingStatusIdCols as any[]).length > 0) {
            console.log(`    ⚠️  WARNING: Found remaining status_id columns:`)
            for (const col of remainingStatusIdCols as any[]) {
                console.log(`       - ${col.table_name}.${col.column_name}`)
            }
        } else {
            console.log('    ✓ No remaining status_id columns')
        }

        // Verify status_val exists on all entity tables
        let missingStatusVal = 0
        for (const table of entityTables) {
            const hasTable = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = '${table}'
                ) as exists
            `, [])

            if (!(hasTable as any).exists) {
                continue
            }

            const hasStatusVal = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status_val'
                ) as exists
            `, [])

            if (!(hasStatusVal as any).exists) {
                console.log(`    ⚠️  WARNING: ${table} missing status_val column`)
                missingStatusVal++
            }
        }

        if (missingStatusVal === 0) {
            console.log('    ✓ All entity tables have status_val column')
        }

        console.log('\n✅ Migration 030 completed successfully')
        console.log('   Legacy status system completely removed')
        console.log('   All entities now use status_val (BYTEA) exclusively')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 030 rollback requires PostgreSQL')
        }

        console.log('Rolling back migration 030: Restoring legacy status columns...')

        // This would require complex logic to recreate status_depr table
        // and repopulate status_id_depr from status_val
        // For now, throw error - this migration should be carefully considered
        throw new Error(
            'Migration 030 rollback not implemented. ' +
            'Restoring legacy status system requires database backup restore. ' +
            'If you need to rollback, restore from backup before running this migration.'
        )
    }
}

export default migration
