/**
 * Migration 063: Fix shape to img field propagation
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * 
 * Background:
 * - Migration 019 created compute_image_shape_fields() with shape→img propagation
 * - Migration 042 replaced compute_image_shape_fields() but REMOVED the propagation logic
 * - This caused images created after migration 042 to have NULL img_* fields
 * 
 * This migration:
 * 1. Restores the shape→img propagation logic to compute_image_shape_fields()
 * 2. Backfills img_* fields for all images that have shape_* data but NULL img_*
 * 
 * Package: F (060-069) - Bug fixes
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '063_fix_shape_to_img_propagation',
    description: 'Restore shape to img field propagation in compute_image_shape_fields trigger',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Migration 063: Skipping (PostgreSQL only)')
            return
        }

        console.log('Running migration 063: Fix shape to img field propagation...')

        // ===================================================================
        // CHAPTER 1: Recreate compute_image_shape_fields with full logic
        // ===================================================================
        console.log('\n📖 Chapter 1: Recreate compute_image_shape_fields() with shape→img propagation')

        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_image_shape_fields()
            RETURNS TRIGGER AS $$
            DECLARE
                fallback_json JSONB;
            BEGIN
                -- Compute img_show based on rtags quality flags (from migration 042)
                -- Show image if not deprecated (rtags bit 0 = 0) 
                -- OR if deprecated but not having issues (rtags bit 1 = 0)
                IF NEW.rtags IS NULL THEN
                    NEW.img_show := true;
                ELSE
                    -- Show if: no quality flags OR only deprecated (not issues)
                    NEW.img_show := (NEW.rtags & 3) IN (0, 1);
                END IF;

                -- ===== Shape → Img propagation (restored from migration 019) =====

                -- Loop 1: Compute img_square (creates fallback for img_thumb)
                IF (NEW.shape_square).json IS NOT NULL THEN
                    NEW.img_square := (NEW.shape_square).json;
                ELSIF (NEW.shape_square).x IS NOT NULL OR (NEW.shape_square).y IS NOT NULL OR (NEW.shape_square).z IS NOT NULL THEN
                    NEW.img_square := jsonb_build_object(
                        'type', 'params',
                        'x', (NEW.shape_square).x,
                        'y', (NEW.shape_square).y,
                        'z', (NEW.shape_square).z
                    );
                ELSIF (NEW.shape_square).url IS NOT NULL THEN
                    NEW.img_square := jsonb_build_object('url', (NEW.shape_square).url);
                ELSE
                    NEW.img_square := NULL;
                END IF;
                
                -- Add blur/turl/tpar if present
                IF NEW.img_square IS NOT NULL THEN
                    IF (NEW.shape_square).blur IS NOT NULL THEN
                        NEW.img_square := NEW.img_square || jsonb_build_object('blur', (NEW.shape_square).blur);
                    END IF;
                    IF (NEW.shape_square).turl IS NOT NULL THEN
                        NEW.img_square := NEW.img_square || jsonb_build_object('turl', (NEW.shape_square).turl);
                    END IF;
                    IF (NEW.shape_square).tpar IS NOT NULL THEN
                        NEW.img_square := NEW.img_square || jsonb_build_object('tpar', (NEW.shape_square).tpar);
                    END IF;
                    -- Add alt_text if present
                    IF NEW.alt_text IS NOT NULL AND NEW.alt_text != '' THEN
                        NEW.img_square := NEW.img_square || jsonb_build_object('alt_text', NEW.alt_text);
                    END IF;
                END IF;
                
                -- Store fallback for Loop 2
                fallback_json := NEW.img_square;

                -- Loop 2: Compute img_thumb (can use fallback from img_square)
                IF (NEW.shape_thumb).json IS NOT NULL THEN
                    NEW.img_thumb := (NEW.shape_thumb).json;
                ELSIF (NEW.shape_thumb).x IS NOT NULL OR (NEW.shape_thumb).y IS NOT NULL OR (NEW.shape_thumb).z IS NOT NULL THEN
                    NEW.img_thumb := jsonb_build_object(
                        'type', 'params',
                        'x', (NEW.shape_thumb).x,
                        'y', (NEW.shape_thumb).y,
                        'z', (NEW.shape_thumb).z
                    );
                ELSIF (NEW.shape_thumb).url IS NOT NULL THEN
                    NEW.img_thumb := jsonb_build_object('url', (NEW.shape_thumb).url);
                ELSIF fallback_json IS NOT NULL THEN
                    -- Use fallback from img_square
                    NEW.img_thumb := fallback_json;
                ELSE
                    NEW.img_thumb := NULL;
                END IF;

                -- Add blur/turl/tpar if present (only if not using fallback)
                IF NEW.img_thumb IS NOT NULL AND NEW.img_thumb IS DISTINCT FROM fallback_json THEN
                    IF (NEW.shape_thumb).blur IS NOT NULL THEN
                        NEW.img_thumb := NEW.img_thumb || jsonb_build_object('blur', (NEW.shape_thumb).blur);
                    END IF;
                    IF (NEW.shape_thumb).turl IS NOT NULL THEN
                        NEW.img_thumb := NEW.img_thumb || jsonb_build_object('turl', (NEW.shape_thumb).turl);
                    END IF;
                    IF (NEW.shape_thumb).tpar IS NOT NULL THEN
                        NEW.img_thumb := NEW.img_thumb || jsonb_build_object('tpar', (NEW.shape_thumb).tpar);
                    END IF;
                    -- Add alt_text if present
                    IF NEW.alt_text IS NOT NULL AND NEW.alt_text != '' THEN
                        NEW.img_thumb := NEW.img_thumb || jsonb_build_object('alt_text', NEW.alt_text);
                    END IF;
                END IF;

                -- Loop 3: Compute img_wide
                IF (NEW.shape_wide).json IS NOT NULL THEN
                    NEW.img_wide := (NEW.shape_wide).json;
                ELSIF (NEW.shape_wide).x IS NOT NULL OR (NEW.shape_wide).y IS NOT NULL OR (NEW.shape_wide).z IS NOT NULL THEN
                    NEW.img_wide := jsonb_build_object(
                        'type', 'params',
                        'x', (NEW.shape_wide).x,
                        'y', (NEW.shape_wide).y,
                        'z', (NEW.shape_wide).z
                    );
                ELSIF (NEW.shape_wide).url IS NOT NULL THEN
                    NEW.img_wide := jsonb_build_object('url', (NEW.shape_wide).url);
                ELSE
                    NEW.img_wide := NULL;
                END IF;

                -- Add blur/turl/tpar if present
                IF NEW.img_wide IS NOT NULL THEN
                    IF (NEW.shape_wide).blur IS NOT NULL THEN
                        NEW.img_wide := NEW.img_wide || jsonb_build_object('blur', (NEW.shape_wide).blur);
                    END IF;
                    IF (NEW.shape_wide).turl IS NOT NULL THEN
                        NEW.img_wide := NEW.img_wide || jsonb_build_object('turl', (NEW.shape_wide).turl);
                    END IF;
                    IF (NEW.shape_wide).tpar IS NOT NULL THEN
                        NEW.img_wide := NEW.img_wide || jsonb_build_object('tpar', (NEW.shape_wide).tpar);
                    END IF;
                    IF NEW.alt_text IS NOT NULL AND NEW.alt_text != '' THEN
                        NEW.img_wide := NEW.img_wide || jsonb_build_object('alt_text', NEW.alt_text);
                    END IF;
                END IF;

                -- Loop 4: Compute img_vert
                IF (NEW.shape_vertical).json IS NOT NULL THEN
                    NEW.img_vert := (NEW.shape_vertical).json;
                ELSIF (NEW.shape_vertical).x IS NOT NULL OR (NEW.shape_vertical).y IS NOT NULL OR (NEW.shape_vertical).z IS NOT NULL THEN
                    NEW.img_vert := jsonb_build_object(
                        'type', 'params',
                        'x', (NEW.shape_vertical).x,
                        'y', (NEW.shape_vertical).y,
                        'z', (NEW.shape_vertical).z
                    );
                ELSIF (NEW.shape_vertical).url IS NOT NULL THEN
                    NEW.img_vert := jsonb_build_object('url', (NEW.shape_vertical).url);
                ELSE
                    NEW.img_vert := NULL;
                END IF;

                -- Add blur/turl/tpar if present
                IF NEW.img_vert IS NOT NULL THEN
                    IF (NEW.shape_vertical).blur IS NOT NULL THEN
                        NEW.img_vert := NEW.img_vert || jsonb_build_object('blur', (NEW.shape_vertical).blur);
                    END IF;
                    IF (NEW.shape_vertical).turl IS NOT NULL THEN
                        NEW.img_vert := NEW.img_vert || jsonb_build_object('turl', (NEW.shape_vertical).turl);
                    END IF;
                    IF (NEW.shape_vertical).tpar IS NOT NULL THEN
                        NEW.img_vert := NEW.img_vert || jsonb_build_object('tpar', (NEW.shape_vertical).tpar);
                    END IF;
                    IF NEW.alt_text IS NOT NULL AND NEW.alt_text != '' THEN
                        NEW.img_vert := NEW.img_vert || jsonb_build_object('alt_text', NEW.alt_text);
                    END IF;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('    ✓ Recreated compute_image_shape_fields() with shape→img propagation')

        // ===================================================================
        // CHAPTER 2: Backfill existing images with NULL img_* fields
        // ===================================================================
        console.log('\n📖 Chapter 2: Backfill images with missing img_* fields')

        // Count affected images (any shape field with missing corresponding img field)
        const countResult = await db.all(`
            SELECT COUNT(*) as count FROM images 
            WHERE (shape_square IS NOT NULL AND img_square IS NULL)
               OR (shape_thumb IS NOT NULL AND img_thumb IS NULL)
               OR (shape_wide IS NOT NULL AND img_wide IS NULL)
               OR (shape_vertical IS NOT NULL AND img_vert IS NULL)
        `)
        const affectedCount = countResult[0]?.count || 0
        console.log(`    Found ${affectedCount} images with shape data but missing img data`)

        if (affectedCount > 0) {
            // Touch all affected images to trigger the updated function
            await db.exec(`
                UPDATE images SET updated_at = NOW()
                WHERE (shape_square IS NOT NULL AND img_square IS NULL)
                   OR (shape_thumb IS NOT NULL AND img_thumb IS NULL)
                   OR (shape_wide IS NOT NULL AND img_wide IS NULL)
                   OR (shape_vertical IS NOT NULL AND img_vert IS NULL)
            `)
            console.log(`    ✓ Triggered update on ${affectedCount} images`)
        }

        // Verify the fix
        const verifyResult = await db.all(`
            SELECT COUNT(*) as count FROM images 
            WHERE (shape_square IS NOT NULL AND img_square IS NULL)
               OR (shape_thumb IS NOT NULL AND img_thumb IS NULL)
               OR (shape_wide IS NOT NULL AND img_wide IS NULL)
               OR (shape_vertical IS NOT NULL AND img_vert IS NULL)
        `)
        const remainingCount = verifyResult[0]?.count || 0

        if (remainingCount === 0) {
            console.log('    ✓ All images now have img_* fields populated')
        } else {
            console.log(`    ⚠️  ${remainingCount} images still have NULL img_* fields (may need manual review)`)
        }

        console.log('\n✅ Migration 063 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Rollback 063: Skipping (PostgreSQL only)')
            return
        }

        console.log('Rolling back migration 063...')

        // Revert to the broken version from 042 (not recommended)
        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_image_shape_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute img_show based on rtags quality flags
                IF NEW.rtags IS NULL THEN
                    NEW.img_show := true;
                ELSE
                    NEW.img_show := (NEW.rtags & 3) IN (0, 1);
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)

        console.log('Rollback 063 complete (reverted to migration 042 version)')
    }
}
