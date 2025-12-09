/**
 * Migration 054: Fix compute_role_visibility function to return r_creator
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * 
 * Background:
 * - Migration 047 created compute_role_visibility(INTEGER, INTEGER) returning r_owner
 * - Migration 050 renamed columns r_owner → r_creator
 * - Migration 052 updated trigger functions to expect r_creator
 * - But compute_role_visibility(INTEGER, INTEGER) still returns r_owner!
 * 
 * This migration fixes compute_role_visibility to return r_creator instead of r_owner.
 * 
 * Package: E (050-059) - Creator/Relations refactoring
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '054_fix_compute_role_visibility',
    description: 'Fix compute_role_visibility function to return r_creator instead of r_owner',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Migration 054: Skipping (PostgreSQL only)')
            return
        }

        console.log('Running migration 054: Fix compute_role_visibility function...')

        // ===================================================================
        // CHAPTER 1: Recreate compute_role_visibility with r_creator
        // ===================================================================
        console.log('\n📖 Chapter 1: Recreate compute_role_visibility(INTEGER, INTEGER)')

        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_role_visibility(
                p_entity_bits INTEGER,  -- Entity type bits (already shifted: post=32, image=48, project=8)
                p_status INTEGER        -- Entity status value
            ) RETURNS TABLE (
                r_anonym BOOLEAN,
                r_partner BOOLEAN,
                r_participant BOOLEAN,
                r_member BOOLEAN,
                r_creator BOOLEAN
            ) AS $$
            DECLARE
                v_state_bits INTEGER;
                v_role_mask INTEGER;
            BEGIN
                -- Extract state from status (bits 0-2 of status map to bits 8-10 of config)
                -- Status stores state in low bits, config expects it in bits 8-10
                v_state_bits := (COALESCE(p_status, 0) & 7) << 8;
                
                -- Initialize all to false
                r_anonym := false;
                r_partner := false;
                r_participant := false;
                r_member := false;
                r_creator := false;
                
                -- Query sysreg_config for matching entries with read capability
                -- Match: same entity bits AND (same state OR state=0 for 'all states')
                -- AND has read capability (bits 11-13 > 0)
                SELECT 
                    COALESCE(BIT_OR(
                        CASE WHEN (value & (7 << 11)) > 0 THEN value ELSE 0 END
                    ), 0) INTO v_role_mask
                FROM sysreg_config
                WHERE 
                    -- Match entity type (bits 3-7)
                    (value & (31 << 3)) = p_entity_bits
                    -- Match state (bits 8-10) OR config is for all states (state bits = 0)
                    AND ((value & (7 << 8)) = v_state_bits OR (value & (7 << 8)) = 0)
                    -- Has read capability (bits 11-13 > 0)
                    AND (value & (7 << 11)) > 0;
                
                -- Extract role bits (25-29) from aggregated config
                r_anonym := (v_role_mask & (1 << 25)) > 0;
                r_partner := (v_role_mask & (1 << 26)) > 0;
                r_participant := (v_role_mask & (1 << 27)) > 0;
                r_member := (v_role_mask & (1 << 28)) > 0;
                r_creator := (v_role_mask & (1 << 29)) > 0;
                
                RETURN NEXT;
            END;
            $$ LANGUAGE plpgsql STABLE;
        `)
        console.log('    ✓ compute_role_visibility() now returns r_creator instead of r_owner')

        // ===================================================================
        // CHAPTER 2: Refresh all entity visibility flags
        // ===================================================================
        console.log('\n📖 Chapter 2: Refresh visibility flags on all entities')

        // Touch posts to re-trigger visibility computation
        await db.exec(`UPDATE posts SET updated_at = NOW()`)
        console.log('    ✓ Touched all posts')

        // Touch images
        await db.exec(`UPDATE images SET updated_at = NOW()`)
        console.log('    ✓ Touched all images')

        // Touch projects
        await db.exec(`UPDATE projects SET updated_at = NOW()`)
        console.log('    ✓ Touched all projects')

        console.log('\n✅ Migration 054 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Rollback 054: Skipping (PostgreSQL only)')
            return
        }

        console.log('Rolling back migration 054...')
        console.log('  ⚠️  Note: This would revert to r_owner but columns are already renamed')
        console.log('  ⚠️  Manual intervention required if rollback is needed')
        console.log('Rollback 054 complete (no changes made)')
    }
}
