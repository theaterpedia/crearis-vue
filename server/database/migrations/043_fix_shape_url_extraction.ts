/**
 * Migration 043: Fix Shape URL Extraction Trigger
 * 
 * Problem: The compute_image_shape_fields trigger was checking:
 *   IF NEW.shape_wide IS NOT NULL THEN
 * 
 * But PostgreSQL considers a composite type with mostly NULL fields as NULL,
 * even if one field (like url) has data. So shape_wide with only url populated
 * was being treated as NULL.
 * 
 * Solution: Check the url field directly:
 *   IF (NEW.shape_wide).url IS NOT NULL THEN
 * 
 * This ensures img_* JSONB fields are populated correctly from shape_* composites.
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '043_fix_shape_url_extraction',
    description: 'Fix trigger to check (shape_*).url IS NOT NULL instead of shape_* IS NOT NULL',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Migration 043: Skipping (PostgreSQL only)')
            return
        }

        console.log('Running migration 043: Fix shape URL extraction trigger...')

        // Replace the trigger function with corrected NULL checks
        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_image_shape_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute img_show from rtags (bit 3 = deprecated flag)
                -- img_show = TRUE if rtags bit 3 is NOT set (not deprecated)
                IF NEW.rtags IS NOT NULL THEN
                    NEW.img_show := (NEW.rtags & 8) = 0;
                ELSE
                    NEW.img_show := TRUE;
                END IF;

                -- Extract URL from shape_square composite to img_square JSONB
                -- FIXED: Check (shape_*).url instead of shape_* for NULL
                IF (NEW.shape_square).url IS NOT NULL THEN
                    NEW.img_square := jsonb_build_object('url', (NEW.shape_square).url);
                    IF (NEW.shape_square).blur IS NOT NULL THEN
                        NEW.img_square := NEW.img_square || jsonb_build_object('blur', (NEW.shape_square).blur);
                    END IF;
                ELSE
                    NEW.img_square := NULL;
                END IF;

                -- Extract URL from shape_thumb composite to img_thumb JSONB
                IF (NEW.shape_thumb).url IS NOT NULL THEN
                    NEW.img_thumb := jsonb_build_object('url', (NEW.shape_thumb).url);
                    IF (NEW.shape_thumb).blur IS NOT NULL THEN
                        NEW.img_thumb := NEW.img_thumb || jsonb_build_object('blur', (NEW.shape_thumb).blur);
                    END IF;
                ELSE
                    NEW.img_thumb := NULL;
                END IF;

                -- Extract URL from shape_wide composite to img_wide JSONB
                IF (NEW.shape_wide).url IS NOT NULL THEN
                    NEW.img_wide := jsonb_build_object('url', (NEW.shape_wide).url);
                    IF (NEW.shape_wide).blur IS NOT NULL THEN
                        NEW.img_wide := NEW.img_wide || jsonb_build_object('blur', (NEW.shape_wide).blur);
                    END IF;
                ELSE
                    NEW.img_wide := NULL;
                END IF;

                -- Extract URL from shape_vertical composite to img_vert JSONB
                IF (NEW.shape_vertical).url IS NOT NULL THEN
                    NEW.img_vert := jsonb_build_object('url', (NEW.shape_vertical).url);
                    IF (NEW.shape_vertical).blur IS NOT NULL THEN
                        NEW.img_vert := NEW.img_vert || jsonb_build_object('blur', (NEW.shape_vertical).blur);
                    END IF;
                ELSE
                    NEW.img_vert := NULL;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)

        console.log('  ✓ Updated compute_image_shape_fields function')

        // Recompute all existing images that have shape data but missing img_* fields
        const result = await db.run(`
            UPDATE images 
            SET updated_at = NOW()
            WHERE (shape_square).url IS NOT NULL 
               OR (shape_thumb).url IS NOT NULL 
               OR (shape_wide).url IS NOT NULL 
               OR (shape_vertical).url IS NOT NULL
        `, [])

        console.log(`  ✓ Recomputed ${result.rowCount || 0} images with shape data`)
        console.log('✓ Migration 043 complete')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        // Revert to old (broken) trigger - not recommended
        console.log('Migration 043 down: No action (keeping fixed trigger)')
    }
}
