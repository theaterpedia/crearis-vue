/**
 * Migration 027: Migrate Status Data
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Migrates data from old status_id_depr (INTEGER FK) to new status_val (BYTEA).
 * Uses value mapping from status_depr table.
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 * 
 * Strategy:
 * 1. For each entity table with status_id_depr
 * 2. Look up original value from status_depr
 * 3. Convert to BYTEA and update status_val
 * 4. Verify migration with count checks
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '027_migrate_status_data',
    description: 'Migrate status data from status_id_depr to status_val BYTEA columns',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 027 requires PostgreSQL')
        }

        console.log('Running migration 027: Migrate status data...')

        // Get all entity tables with status_id_depr
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

        // ===================================================================
        // CHAPTER 1: Verify Migration Readiness
        // ===================================================================
        console.log('\n📖 Chapter 1: Verify Migration Readiness')

        // Check that status_depr table exists
        const statusDeprExists = await db.get(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'status_depr'
            ) as exists
        `, [])

        if (!(statusDeprExists as any).exists) {
            throw new Error('status_depr table not found - migration 023 may not have run')
        }

        console.log('    ✓ status_depr table exists')

        // Check that all entity tables have both columns
        for (const table of entityTables) {
            const hasOldCol = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status_id_depr'
                ) as exists
            `, [])

            const hasNewCol = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status_val'
                ) as exists
            `, [])

            if (!(hasOldCol as any).exists) {
                throw new Error(`${table}.status_id_depr not found - migration 023 may not have run`)
            }
            if (!(hasNewCol as any).exists) {
                throw new Error(`${table}.status_val not found - migration 025 may not have run`)
            }
        }

        console.log(`    ✓ All ${entityTables.length} entity tables have both columns`)

        // ===================================================================
        // CHAPTER 2: Migrate Data for Each Entity Table
        // ===================================================================
        console.log('\n📖 Chapter 2: Migrate Data for Each Entity Table')

        let totalMigrated = 0
        let totalSkipped = 0

        for (const table of entityTables) {
            console.log(`\n  Processing ${table}:`)

            // Count records to migrate (only those with valid status_id_depr > 0)
            const countResult = await db.get(`
                SELECT COUNT(*) as count 
                FROM ${table} 
                WHERE status_id_depr IS NOT NULL
                AND status_id_depr > 0
            `, [])
            const recordCount = (countResult as any).count

            if (recordCount === 0) {
                console.log(`    ℹ️  No records to migrate (status_id_depr is NULL or 0)`)
                continue
            }

            // Migrate using JOIN to status_depr to get original value
            // Only migrate records where status_id_depr > 0 (valid FK)
            const result = await db.exec(`
                UPDATE ${table}
                SET status_val = int2send(s.value)::bytea
                FROM status_depr s
                WHERE ${table}.status_id_depr = s.id
                AND ${table}.status_id_depr > 0
            `)

            console.log(`    ✓ Migrated ${recordCount} records (${table}.status_id_depr → status_val)`)

            // Verify migration
            const verifyResult = await db.get(`
                SELECT COUNT(*) as count
                FROM ${table}
                WHERE status_id_depr > 0
                AND status_val IS NULL
            `, [])

            const unmigrated = (verifyResult as any).count
            if (unmigrated > 0) {
                console.warn(`    ⚠️  Warning: ${unmigrated} records still have NULL status_val`)
            }

            // Report records with status_id_depr = 0 (never had status)
            const zeroStatusResult = await db.get(`
                SELECT COUNT(*) as count
                FROM ${table}
                WHERE status_id_depr = 0
            `, [])
            const zeroCount = (zeroStatusResult as any).count
            if (zeroCount > 0) {
                console.log(`    ℹ️  ${zeroCount} records have status_id_depr = 0 (never had status, skipped)`)
            }

            totalMigrated += recordCount
        }

        console.log(`\n  Total migrated: ${totalMigrated} records across ${entityTables.length} tables`)

        // ===================================================================
        // CHAPTER 3: Verification and Statistics
        // ===================================================================
        console.log('\n📖 Chapter 3: Verification and Statistics')

        // Count status_val distribution
        console.log('\n  Status value distribution:')

        for (const table of entityTables) {
            const distribution = await db.all(`
                SELECT 
                    encode(status_val, 'hex') as hex_val,
                    get_sysreg_label(status_val, 'status', 'en') as label,
                    COUNT(*) as count
                FROM ${table}
                WHERE status_val IS NOT NULL
                GROUP BY status_val
                ORDER BY count DESC
                LIMIT 5
            `, [])

            if ((distribution as any[]).length > 0) {
                console.log(`\n    ${table}:`)
                for (const row of distribution as any[]) {
                    console.log(`      0x${row.hex_val} (${row.label}): ${row.count} records`)
                }
            }
        }

        // Summary counts
        console.log('\n  Migration summary by table:')
        const summaries = []

        for (const table of entityTables) {
            const summary = await db.get(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status_id_depr > 0 THEN 1 END) as had_old,
                    COUNT(status_val) as has_new,
                    COUNT(CASE WHEN status_id_depr > 0 AND status_val IS NULL THEN 1 END) as missing,
                    COUNT(CASE WHEN status_id_depr = 0 THEN 1 END) as never_had_status
                FROM ${table}
            `, [])

            summaries.push({ table, ...(summary as any) })
            const s = summary as any
            if (s.never_had_status > 0) {
                console.log(`    ${table}: ${s.has_new}/${s.had_old} migrated (${s.never_had_status} never had status)`)
            } else {
                console.log(`    ${table}: ${s.has_new}/${s.had_old} migrated`)
            }
        }

        // Check for any issues
        const issues = summaries.filter((s: any) => s.missing > 0)
        if (issues.length > 0) {
            console.warn('\n  ⚠️  Tables with missing migrations:')
            for (const issue of issues) {
                console.warn(`    ${issue.table}: ${issue.missing} records not migrated`)
            }
        } else {
            console.log('\n  ✅ All records successfully migrated!')
        }

        console.log('\n✅ Migration 027 completed: Status data migrated to sysreg system')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 027: Clearing status_val columns...')

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

        // Clear status_val columns (restore to NULL)
        for (const table of entityTables) {
            await db.exec(`UPDATE ${table} SET status_val = NULL`)
            console.log(`  ✓ Cleared ${table}.status_val`)
        }

        console.log('✅ Migration 027 rollback completed (status_id_depr preserved)')
    }
}
