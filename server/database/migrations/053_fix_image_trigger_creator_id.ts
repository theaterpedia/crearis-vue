/**
 * Migration 053: Fix update_image_computed_fields trigger to use creator_id
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * 
 * Background:
 * - Migration 042 created update_image_computed_fields() referencing owner_id
 * - Migration 050 renamed owner_id → creator_id on images table
 * - This migration fixes the trigger to use creator_id
 * 
 * Also fixes: compute_image_shape_fields if needed
 * 
 * Package: E (050-059) - Creator/Relations refactoring
 */

import type { DatabaseAdapter } from '../adapter'

// Scope bit values (same as migration 042)
const SCOPE = {
    TEAM: 131072,      // 1 << 17
    LOGIN: 262144,     // 1 << 18
    PROJECT: 524288,   // 1 << 19
    REGIO: 1048576,    // 1 << 20
    PUBLIC: 2097152    // 1 << 21
}

// Quality bit values for rtags
const QUALITY = {
    DEPRECATED: 1,     // 1 << 0
    ISSUES: 2          // 1 << 1
}

export const migration = {
    id: '053_fix_image_trigger_creator_id',
    description: 'Fix update_image_computed_fields trigger to use creator_id instead of owner_id',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Migration 053: Skipping (PostgreSQL only)')
            return
        }

        console.log('Running migration 053: Fix image trigger for creator_id...')

        // ===================================================================
        // CHAPTER 1: Fix update_image_computed_fields trigger
        // ===================================================================
        console.log('\n📖 Chapter 1: Fix update_image_computed_fields()')

        await db.exec(`
            CREATE OR REPLACE FUNCTION update_image_computed_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute about field (using creator_id instead of owner_id)
                IF (NEW.author).account_id IS NOT NULL THEN
                    NEW.about := '(c) ' || (NEW.author).account_id || ' via ' || (NEW.author).adapter::text;
                ELSIF NEW.creator_id IS NOT NULL THEN
                    NEW.about := '(c) creator_id:' || NEW.creator_id::text;
                ELSE
                    NEW.about := NULL;
                END IF;

                -- Compute use_player (unchanged from original)
                NEW.use_player := NEW.publisher IS NOT NULL AND
                                 ((NEW.publisher).adapter = 'vimeo' OR (NEW.publisher).adapter = 'youtube');

                -- Compute visibility flags from status.scope bits (17-21)
                IF NEW.status IS NULL THEN
                    NEW.is_public := false;
                    NEW.is_private := false;
                    NEW.is_internal := true;
                ELSE
                    NEW.is_public := (NEW.status & ${SCOPE.REGIO}) != 0 OR (NEW.status & ${SCOPE.PUBLIC}) != 0;
                    NEW.is_private := (NEW.status & ${SCOPE.LOGIN}) != 0;
                    NEW.is_internal := (NEW.status & ${SCOPE.TEAM}) != 0;
                END IF;

                -- Compute quality flags from rtags (bits 0-1)
                IF NEW.rtags IS NULL THEN
                    NEW.is_deprecated := false;
                    NEW.has_issues := false;
                ELSE
                    NEW.is_deprecated := (NEW.rtags & ${QUALITY.DEPRECATED}) != 0;
                    NEW.has_issues := (NEW.rtags & ${QUALITY.ISSUES}) != 0;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('    ✓ update_image_computed_fields() now uses creator_id')

        // ===================================================================
        // CHAPTER 2: Verify the column exists
        // ===================================================================
        console.log('\n📖 Chapter 2: Verify creator_id column exists')

        const result = await db.get(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'images' AND column_name = 'creator_id'
        `)

        if (result) {
            console.log('    ✓ creator_id column exists in images table')
        } else {
            console.log('    ⚠️ Warning: creator_id column not found - run migration 050 first')
        }

        // ===================================================================
        // CHAPTER 3: Touch images to re-trigger computation
        // ===================================================================
        console.log('\n📖 Chapter 3: Refresh computed fields on existing images')

        await db.exec(`UPDATE images SET updated_at = NOW()`)
        console.log('    ✓ Touched all images to refresh computed fields')

        console.log('\n✅ Migration 053 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Rollback 053: Skipping (PostgreSQL only)')
            return
        }

        console.log('Rolling back migration 053...')
        console.log('  ⚠️  Note: This would revert to owner_id but column is already renamed')
        console.log('  ⚠️  Manual intervention required if rollback is needed')
        console.log('Rollback 053 complete (no changes made)')
    }
}
