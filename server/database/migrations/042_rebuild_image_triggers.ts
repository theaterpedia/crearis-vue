/**
 * Migration 042: Rebuild Image Triggers with INTEGER-based logic
 * 
 * This migration:
 * 1. Deletes all existing rtags entries
 * 2. Adds new "Quality" tag group to rtags with two toggles:
 *    - deprecated (bit 0, value 1)
 *    - issues (bit 1, value 2)
 * 3. Rebuilds compute_image_shape_fields() trigger with INTEGER ctags
 * 4. Rebuilds update_image_computed_fields() trigger with:
 *    - Visibility derived from status.scope bits (17-21)
 *    - Quality flags from rtags (bits 0-1)
 * 
 * Scope bit mapping (from Migration 040):
 * - scope_team:    bit 17 (value 131072)
 * - scope_login:   bit 18 (value 262144)  
 * - scope_project: bit 19 (value 524288)
 * - scope_regio:   bit 20 (value 1048576)
 * - scope_public:  bit 21 (value 2097152)
 * 
 * Visibility mapping:
 * - is_public:   (status & scope_regio) != 0 OR (status & scope_public) != 0
 * - is_private:  (status & scope_login) != 0
 * - is_internal: (status & scope_team) != 0
 * 
 * Quality mapping (from rtags):
 * - is_deprecated: (rtags & 1) != 0
 * - has_issues:    (rtags & 2) != 0
 */

import type { DatabaseAdapter } from '../adapter'

// Scope bit values from Migration 040
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
    id: '042_rebuild_image_triggers',
    description: 'Rebuild image triggers with INTEGER-based logic, add Quality group to rtags',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 042 requires PostgreSQL.')
        }

        console.log('Running migration 042: Rebuild Image Triggers...')

        // ==================== Step 1: Delete existing rtags entries ====================
        console.log('\n📖 Step 1: Delete existing rtags entries')
        const deleteResult = await db.run('DELETE FROM sysreg_rtags WHERE tagfamily = $1', ['rtags'])
        console.log('  ✓ Deleted all existing rtags entries')

        // ==================== Step 2: Add Quality tag group to rtags ====================
        console.log('\n📖 Step 2: Add Quality tag group to rtags')

        // Insert deprecated toggle (bit 0)
        await db.run(`
            INSERT INTO sysreg_rtags (
                tagfamily, taglogic, name, value, description, 
                name_i18n, desc_i18n, is_default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            'rtags',
            'toggle',
            'deprecated',
            QUALITY.DEPRECATED,
            'Content is deprecated/outdated',
            JSON.stringify({ de: 'Veraltet', en: 'Deprecated' }),
            JSON.stringify({ de: 'Inhalt ist veraltet', en: 'Content is deprecated/outdated' }),
            false
        ])
        console.log('  ✓ Added deprecated toggle (bit 0, value 1)')

        // Insert issues toggle (bit 1)
        await db.run(`
            INSERT INTO sysreg_rtags (
                tagfamily, taglogic, name, value, description, 
                name_i18n, desc_i18n, is_default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            'rtags',
            'toggle',
            'issues',
            QUALITY.ISSUES,
            'Content has quality issues',
            JSON.stringify({ de: 'Probleme', en: 'Issues' }),
            JSON.stringify({ de: 'Inhalt hat Qualitätsprobleme', en: 'Content has quality issues' }),
            false
        ])
        console.log('  ✓ Added issues toggle (bit 1, value 2)')

        // ==================== Step 3: Rebuild compute_image_shape_fields trigger ====================
        console.log('\n📖 Step 3: Rebuild compute_image_shape_fields trigger')
        
        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_image_shape_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute img_show based on rtags quality flags
                -- Show image if not deprecated (rtags bit 0 = 0) 
                -- OR if deprecated but not having issues (rtags bit 1 = 0)
                -- Legacy logic: show if quality bits are 0 (ok) or 64 (deprecated only)
                IF NEW.rtags IS NULL THEN
                    NEW.img_show := true;
                ELSE
                    -- Show if: no quality flags OR only deprecated (not issues)
                    NEW.img_show := (NEW.rtags & 3) IN (0, 1);
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('  ✓ Rebuilt compute_image_shape_fields trigger')
        console.log('    - img_show: true if rtags quality bits are 0 (ok) or 1 (deprecated only)')

        // ==================== Step 4: Rebuild update_image_computed_fields trigger ====================
        console.log('\n📖 Step 4: Rebuild update_image_computed_fields trigger')
        
        await db.exec(`
            CREATE OR REPLACE FUNCTION update_image_computed_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute about field (unchanged from original)
                IF (NEW.author).account_id IS NOT NULL THEN
                    NEW.about := '(c) ' || (NEW.author).account_id || ' via ' || (NEW.author).adapter::text;
                ELSIF NEW.owner_id IS NOT NULL THEN
                    NEW.about := '(c) owner_id:' || NEW.owner_id::text;
                ELSE
                    NEW.about := NULL;
                END IF;

                -- Compute use_player (unchanged from original)
                NEW.use_player := NEW.publisher IS NOT NULL AND
                                 ((NEW.publisher).adapter = 'vimeo' OR (NEW.publisher).adapter = 'youtube');

                -- Compute visibility flags from status.scope bits (17-21)
                -- scope_team:    bit 17 (131072)
                -- scope_login:   bit 18 (262144)
                -- scope_project: bit 19 (524288)
                -- scope_regio:   bit 20 (1048576)
                -- scope_public:  bit 21 (2097152)
                IF NEW.status IS NULL THEN
                    NEW.is_public := false;
                    NEW.is_private := false;
                    NEW.is_internal := true;
                ELSE
                    -- is_public: visible if regio OR public scope
                    NEW.is_public := (NEW.status & ${SCOPE.REGIO}) != 0 OR (NEW.status & ${SCOPE.PUBLIC}) != 0;
                    
                    -- is_private: visible if login scope (users only)
                    NEW.is_private := (NEW.status & ${SCOPE.LOGIN}) != 0;
                    
                    -- is_internal: visible if team scope
                    NEW.is_internal := (NEW.status & ${SCOPE.TEAM}) != 0;
                END IF;

                -- Compute quality flags from rtags (bits 0-1)
                IF NEW.rtags IS NULL THEN
                    NEW.is_deprecated := false;
                    NEW.has_issues := false;
                ELSE
                    -- is_deprecated: rtags bit 0
                    NEW.is_deprecated := (NEW.rtags & ${QUALITY.DEPRECATED}) != 0;
                    
                    -- has_issues: rtags bit 1
                    NEW.has_issues := (NEW.rtags & ${QUALITY.ISSUES}) != 0;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('  ✓ Rebuilt update_image_computed_fields trigger')
        console.log('    - is_public: status & (scope_regio | scope_public)')
        console.log('    - is_private: status & scope_login')
        console.log('    - is_internal: status & scope_team')
        console.log('    - is_deprecated: rtags & 1')
        console.log('    - has_issues: rtags & 2')

        // ==================== Step 5: Refresh existing images ====================
        console.log('\n📖 Step 5: Refresh computed fields on existing images')
        
        // Touch all images to trigger recomputation
        await db.exec(`
            UPDATE images SET updated_at = NOW();
        `)
        console.log('  ✓ Triggered recomputation on all images')

        // ==================== Summary ====================
        console.log('\n📖 Step 6: Migration Summary')
        
        const rtagsCount = await db.get('SELECT COUNT(*) as count FROM sysreg_rtags WHERE tagfamily = $1', ['rtags'])
        const imgCount = await db.get('SELECT COUNT(*) as count FROM images')
        
        console.log(`  ✓ rtags entries: ${(rtagsCount as any).count} (Quality group: deprecated, issues)`)
        console.log(`  ✓ Images refreshed: ${(imgCount as any).count}`)
        console.log('  ✓ Triggers rebuilt with INTEGER-based logic')
        console.log('\n✅ Migration 042 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 042...')

        // Delete the new rtags entries
        await db.run('DELETE FROM sysreg_rtags WHERE tagfamily = $1', ['rtags'])
        console.log('  ✓ Deleted Quality rtags entries')

        // Restore triggers to temporary state (from Migration 039)
        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_image_shape_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.img_show := true;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)

        await db.exec(`
            CREATE OR REPLACE FUNCTION update_image_computed_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                IF (NEW.author).account_id IS NOT NULL THEN
                    NEW.about := '(c) ' || (NEW.author).account_id || ' via ' || (NEW.author).adapter::text;
                ELSIF NEW.owner_id IS NOT NULL THEN
                    NEW.about := '(c) owner_id:' || NEW.owner_id::text;
                ELSE
                    NEW.about := NULL;
                END IF;

                NEW.use_player := NEW.publisher IS NOT NULL AND
                                 ((NEW.publisher).adapter = 'vimeo' OR (NEW.publisher).adapter = 'youtube');

                NEW.is_public := false;
                NEW.is_private := false;
                NEW.is_internal := true;
                NEW.is_deprecated := false;
                NEW.has_issues := false;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('  ✓ Reverted triggers to temporary state')

        console.log('✅ Rollback complete')
    }
}
