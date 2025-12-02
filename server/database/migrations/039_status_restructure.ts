/**
 * Migration 039: Restructure status system
 * 
 * Changes:
 * 1. Add `status` INTEGER column to images table (aligned with other entities)
 * 2. Drop `status_val` BYTEA column from images table
 * 3. Drop `config_val` BYTEA column from images table (cleanup)
 * 4. Delete all existing sysreg_status entries
 * 5. Reset all entity status fields to default (0)
 * 6. Insert new status taxonomy with 2 tag groups:
 *    - status: Core lifecycle status (7 categories, some with subcategories)
 *    - scope: Visibility scope (5 categories)
 * 
 * New Status Structure:
 * 
 * TagGroup 'status' (bits 0-9) - Core lifecycle status:
 * - new (bit 0): newly created, needs review
 *   - new_image (subcategory): raw image
 *   - new_user (subcategory): passive user
 * - demo (bits 1-2): illustrational/tutorial data
 *   - demo_event (subcategory): template event
 *   - demo_project (subcategory): template project
 *   - demo_user (subcategory): verified demo user
 * - draft (bits 3-4): work in progress
 *   - draft_user (subcategory): activated user
 * - confirmed (bits 5-6): reviewed and confirmed
 *   - confirmed_user (subcategory): configured user
 * - released (bits 7-8): published/live
 *   - released_user (subcategory): completed user
 * - archived (bit 9): archived, no longer active
 * - trash (bit 10): marked for deletion
 * 
 * TagGroup 'scope' (bits 11-15) - Visibility scope:
 * - team (bit 11): visible to instructors/admins
 * - login (bit 12): visible to all logged-in users
 * - project (bit 13): visible on project website
 * - regio (bit 14): visible in regional scope
 * - public (bit 15): public domain, whole network
 * 
 * Total: ~20 status entries
 */

import type { DatabaseAdapter } from '../adapter'

async function insertStatus(
    db: DatabaseAdapter,
    taglogic: string,
    name: string,
    value: number,
    labelDe: string,
    labelEn: string,
    parentBit?: number
) {
    const sql = `
        INSERT INTO sysreg_status (
            tagfamily, taglogic, name, value, description, 
            name_i18n, desc_i18n, is_default, parent_bit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    await db.run(sql, [
        'status',
        taglogic,
        name,
        value,
        null,
        JSON.stringify({ de: labelDe, en: labelEn }),
        null,
        false,
        parentBit ?? null
    ])
}

export const migration = {
    id: '039_status_restructure',
    description: 'Restructure status system with lifecycle + scope, align images table',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 039 requires PostgreSQL.')
        }

        console.log('Running migration 039: Status System Restructure...')
        console.log('⚠️  WARNING: This migration will DELETE all existing status values!')

        // ==================== Step 1: Align images table ====================
        console.log('\n📖 Step 1: Align images table schema')

        // Add status column if not exists
        const statusColExists = await db.get(
            "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'status')",
            []
        )
        if (!(statusColExists as any).exists) {
            await db.exec(`
                ALTER TABLE images ADD COLUMN status INTEGER DEFAULT 0;
                CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
            `)
            console.log('  ✓ Added status INTEGER column to images')
        } else {
            console.log('  ⏭️  status column already exists in images')
        }

        // Drop status_val if exists
        const statusValExists = await db.get(
            "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'status_val')",
            []
        )
        if ((statusValExists as any).exists) {
            await db.exec(`
                DROP INDEX IF EXISTS idx_images_status_val;
                ALTER TABLE images DROP COLUMN status_val;
            `)
            console.log('  ✓ Dropped status_val BYTEA column from images')
        }

        // Drop config_val if exists (cleanup)
        const configValExists = await db.get(
            "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'config_val')",
            []
        )
        if ((configValExists as any).exists) {
            await db.exec(`
                DROP INDEX IF EXISTS idx_images_config_val;
                ALTER TABLE images DROP COLUMN config_val;
            `)
            console.log('  ✓ Dropped config_val BYTEA column from images')
        }

        // ==================== Step 2: Delete existing status entries ====================
        console.log('\n📖 Step 2: Delete existing sysreg_status entries')
        await db.run('DELETE FROM sysreg_status WHERE tagfamily = $1', ['status'])
        console.log('  ✓ Deleted all existing status entries')

        // ==================== Step 2b: Fix compute_image_shape_fields trigger ====================
        console.log('\n📖 Step 2b: Fix compute_image_shape_fields trigger (remove BYTEA dependency)')
        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_image_shape_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute img_show: temporarily set to true (TODO: rebuild logic with INTEGER ctags)
                NEW.img_show := true;
                
                -- Shape computation removed - image_shape is a composite type
                -- that requires proper composite value construction, not string casting
                -- TODO: Rebuild shape computation if needed
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('  ✓ Fixed compute_image_shape_fields trigger (img_show temporarily set to true)')

        // ==================== Step 2c: Fix update_image_computed_fields trigger ====================
        console.log('\n📖 Step 2c: Fix update_image_computed_fields trigger (remove BYTEA dependency)')
        await db.exec(`
            CREATE OR REPLACE FUNCTION update_image_computed_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute about field
                IF (NEW.author).account_id IS NOT NULL THEN
                    NEW.about := '(c) ' || (NEW.author).account_id || ' via ' || (NEW.author).adapter::text;
                ELSIF NEW.owner_id IS NOT NULL THEN
                    NEW.about := '(c) owner_id:' || NEW.owner_id::text;
                ELSE
                    NEW.about := NULL;
                END IF;

                -- Compute use_player
                NEW.use_player := NEW.publisher IS NOT NULL AND
                                 ((NEW.publisher).adapter = 'vimeo' OR (NEW.publisher).adapter = 'youtube');

                -- TODO: Rebuild visibility logic with INTEGER ctags/status
                -- Temporarily set defaults (all will be handled via status.scope in future)
                NEW.is_public := false;
                NEW.is_private := false;
                NEW.is_internal := true;

                -- TODO: Rebuild quality flag logic with INTEGER ctags
                -- Temporarily set defaults
                NEW.is_deprecated := false;
                NEW.has_issues := false;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('  ✓ Fixed update_image_computed_fields trigger (visibility/quality flags temporarily defaulted)')

        // ==================== Step 3: Disable validation triggers ====================
        console.log('\n📖 Step 3: Disable status validation triggers')
        await db.exec(`
            -- Disable validation triggers that check against sysreg_status
            ALTER TABLE events DISABLE TRIGGER trg_validate_event_status;
        `)
        console.log('  ✓ Disabled validation triggers on entity tables')

        // ==================== Step 4: Reset all entity status fields ====================
        console.log('\n📖 Step 4: Reset entity status fields to 0')
        const entityTables = ['images', 'projects', 'events', 'posts', 'users', 'instructors']
        for (const table of entityTables) {
            const tableExists = await db.get(
                'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
                [table]
            )
            if (tableExists && (tableExists as any).exists) {
                const statusExists = await db.get(
                    'SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)',
                    [table, 'status']
                )
                if (statusExists && (statusExists as any).exists) {
                    await db.run(`UPDATE ${table} SET status = 0`, [])
                    console.log(`  ✓ Reset status to 0 in ${table}`)
                }
            }
        }

        // ==================== Step 5: Insert new status structure ====================
        console.log('\n📖 Step 5: Insert TagGroup "status" (bits 0-12)')

        // new: bit 0 (category + 2 subcategories at bits 0-1)
        await insertStatus(db, 'category', 'new', 1, 'Neu', 'New')
        await insertStatus(db, 'subcategory', 'new_image', 2, 'Roh', 'Raw', 0)
        await insertStatus(db, 'subcategory', 'new_user', 3, 'Passiv', 'Passive', 0)

        // demo: bits 2-4 (category + 3 subcategories)
        await insertStatus(db, 'category', 'demo', 4, 'Demo', 'Demo')
        await insertStatus(db, 'subcategory', 'demo_event', 8, 'Vorlage', 'Template', 2)
        await insertStatus(db, 'subcategory', 'demo_project', 12, 'Vorlage', 'Template', 2)
        await insertStatus(db, 'subcategory', 'demo_user', 16, 'Verifiziert', 'Verified', 2)

        // draft: bits 5-6 (category + 1 subcategory)
        await insertStatus(db, 'category', 'draft', 32, 'Entwurf', 'Draft')
        await insertStatus(db, 'subcategory', 'draft_user', 64, 'Aktiviert', 'Activated', 5)

        // confirmed: bits 7-8 (category + 1 subcategory)
        await insertStatus(db, 'category', 'confirmed', 128, 'Bestätigt', 'Confirmed')
        await insertStatus(db, 'subcategory', 'confirmed_user', 256, 'Konfiguriert', 'Configured', 7)

        // released: bits 9-10 (category + 1 subcategory)
        await insertStatus(db, 'category', 'released', 512, 'Freigegeben', 'Released')
        await insertStatus(db, 'subcategory', 'released_user', 1024, 'Abgeschlossen', 'Completed', 9)

        // archived: bit 11 (category only)
        await insertStatus(db, 'category', 'archived', 2048, 'Archiviert', 'Archived')

        // trash: bit 12 (category only)
        await insertStatus(db, 'category', 'trash', 4096, 'Papierkorb', 'Trash')

        console.log('  ✓ Inserted status group: 7 categories, 8 subcategories')

        // ==================== Step 6: Insert scope structure ====================
        console.log('\n📖 Step 6: Insert TagGroup "scope" (bits 13-17)')

        // scope categories (single bit toggles)
        await insertStatus(db, 'toggle', 'scope_team', 8192, 'Team', 'Team')
        await insertStatus(db, 'toggle', 'scope_login', 16384, 'Login', 'Login')
        await insertStatus(db, 'toggle', 'scope_project', 32768, 'Projekt', 'Project')
        await insertStatus(db, 'toggle', 'scope_regio', 65536, 'Regional', 'Regional')
        await insertStatus(db, 'toggle', 'scope_public', 131072, 'Öffentlich', 'Public')

        console.log('  ✓ Inserted scope group: 5 toggles')

        // ==================== Step 7: Re-enable validation triggers ====================
        console.log('\n📖 Step 7: Re-enable validation triggers')
        await db.exec(`
            ALTER TABLE events ENABLE TRIGGER trg_validate_event_status;
        `)
        console.log('  ✓ Re-enabled validation triggers on entity tables')

        // ==================== Summary ====================
        console.log('\n📖 Step 8: Migration Summary')
        const statusCount = await db.get('SELECT COUNT(*) as count FROM sysreg_status WHERE tagfamily = $1', ['status'])
        console.log(`  ✓ Total status entries: ${(statusCount as any).count}`)
        console.log('  ✓ images table aligned (status INTEGER, dropped status_val/config_val)')
        console.log('  ✓ All entity status fields reset to 0')
        console.log('  ✓ Bit allocation: 0-12 (status lifecycle), 13-17 (scope)')
        console.log('\n✅ Migration 039 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 039...')

        // Delete all status entries
        await db.run('DELETE FROM sysreg_status WHERE tagfamily = $1', ['status'])

        // Restore status_val column to images (can't restore data)
        await db.exec(`
            ALTER TABLE images ADD COLUMN IF NOT EXISTS status_val BYTEA;
            ALTER TABLE images ADD COLUMN IF NOT EXISTS config_val BYTEA;
        `)

        console.log('  ✓ Deleted all status entries')
        console.log('  ✓ Restored status_val/config_val columns to images (data lost)')
        console.log('  ⚠️  Note: Original status data cannot be restored')
        console.log('✅ Rollback complete')
    }
}
