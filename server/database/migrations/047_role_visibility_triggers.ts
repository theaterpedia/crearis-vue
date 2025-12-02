/**
 * Migration 047: Create role visibility triggers
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Creates triggers that maintain r_anonym, r_partner, r_participant, r_member, r_owner
 * columns based on the entity's status field and the sysreg_config capabilities matrix.
 * 
 * Trigger Logic:
 * 1. Extract state from entity status (bits 8-10)
 * 2. Look up sysreg_config entries matching entity type + state
 * 3. For each config entry with read capability (bits 11-13 > 0):
 *    - Check which role bits (25-29) are set
 *    - Set corresponding r_* columns to true
 * 
 * Bit positions (from 044_capabilities_matrix.ts):
 * - Entity (bits 3-7): post=00100(32), image=00110(48), project=00001(8)
 * - State (bits 8-10): new=1, demo=2, draft=3, review=4, released=5, archived=6, trash=7
 * - Read capability (bits 11-13): >0 means readable
 * - Roles (bits 25-29): anonym=25, partner=26, participant=27, member=28, owner=29
 * 
 * Package: D (040-049) - Auth system refactoring
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '047_role_visibility_triggers',
    description: 'Create triggers to maintain r_* columns based on sysreg_config',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 047 requires PostgreSQL')
        }

        console.log('Running migration 047: Role visibility triggers...')

        // ===================================================================
        // CORE FUNCTION: Compute visibility from sysreg_config
        // ===================================================================

        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_role_visibility(
                p_entity_bits INTEGER,  -- Entity type bits (already shifted: post=32, image=48, project=8)
                p_status INTEGER        -- Entity status value
            ) RETURNS TABLE (
                r_anonym BOOLEAN,
                r_partner BOOLEAN,
                r_participant BOOLEAN,
                r_member BOOLEAN,
                r_owner BOOLEAN
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
                r_owner := false;
                
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
                r_owner := (v_role_mask & (1 << 29)) > 0;
                
                RETURN NEXT;
            END;
            $$ LANGUAGE plpgsql STABLE;
        `)

        // ===================================================================
        // POSTS TRIGGER
        // ===================================================================

        await db.exec(`
            CREATE OR REPLACE FUNCTION trigger_posts_visibility()
            RETURNS trigger AS $$
            DECLARE
                v_visibility RECORD;
            BEGIN
                -- Entity bits for post: 00100 << 3 = 32
                SELECT * INTO v_visibility FROM compute_role_visibility(32, NEW.status);
                
                NEW.r_anonym := v_visibility.r_anonym;
                NEW.r_partner := v_visibility.r_partner;
                NEW.r_participant := v_visibility.r_participant;
                NEW.r_member := v_visibility.r_member;
                NEW.r_owner := v_visibility.r_owner;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)

        await db.exec(`
            DROP TRIGGER IF EXISTS trigger_posts_role_visibility ON posts;
            CREATE TRIGGER trigger_posts_role_visibility
            BEFORE INSERT OR UPDATE OF status ON posts
            FOR EACH ROW
            EXECUTE FUNCTION trigger_posts_visibility();
        `)

        // ===================================================================
        // IMAGES TRIGGER
        // ===================================================================

        await db.exec(`
            CREATE OR REPLACE FUNCTION trigger_images_visibility()
            RETURNS trigger AS $$
            DECLARE
                v_visibility RECORD;
            BEGIN
                -- Entity bits for image: 00110 << 3 = 48
                SELECT * INTO v_visibility FROM compute_role_visibility(48, NEW.status);
                
                NEW.r_anonym := v_visibility.r_anonym;
                NEW.r_partner := v_visibility.r_partner;
                NEW.r_participant := v_visibility.r_participant;
                NEW.r_member := v_visibility.r_member;
                NEW.r_owner := v_visibility.r_owner;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)

        await db.exec(`
            DROP TRIGGER IF EXISTS trigger_images_role_visibility ON images;
            CREATE TRIGGER trigger_images_role_visibility
            BEFORE INSERT OR UPDATE OF status ON images
            FOR EACH ROW
            EXECUTE FUNCTION trigger_images_visibility();
        `)

        // ===================================================================
        // PROJECTS TRIGGER
        // ===================================================================

        await db.exec(`
            CREATE OR REPLACE FUNCTION trigger_projects_visibility()
            RETURNS trigger AS $$
            DECLARE
                v_visibility RECORD;
            BEGIN
                -- Entity bits for project: 00001 << 3 = 8
                SELECT * INTO v_visibility FROM compute_role_visibility(8, NEW.status);
                
                NEW.r_anonym := v_visibility.r_anonym;
                NEW.r_partner := v_visibility.r_partner;
                NEW.r_participant := v_visibility.r_participant;
                NEW.r_member := v_visibility.r_member;
                NEW.r_owner := v_visibility.r_owner;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)

        await db.exec(`
            DROP TRIGGER IF EXISTS trigger_projects_role_visibility ON projects;
            CREATE TRIGGER trigger_projects_role_visibility
            BEFORE INSERT OR UPDATE OF status ON projects
            FOR EACH ROW
            EXECUTE FUNCTION trigger_projects_visibility();
        `)

        console.log('Migration 047 complete: Role visibility triggers created')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 047 rollback requires PostgreSQL')
        }

        // Drop triggers
        await db.exec(`DROP TRIGGER IF EXISTS trigger_posts_role_visibility ON posts;`)
        await db.exec(`DROP TRIGGER IF EXISTS trigger_images_role_visibility ON images;`)
        await db.exec(`DROP TRIGGER IF EXISTS trigger_projects_role_visibility ON projects;`)

        // Drop functions
        await db.exec(`DROP FUNCTION IF EXISTS trigger_posts_visibility();`)
        await db.exec(`DROP FUNCTION IF EXISTS trigger_images_visibility();`)
        await db.exec(`DROP FUNCTION IF EXISTS trigger_projects_visibility();`)
        await db.exec(`DROP FUNCTION IF EXISTS compute_role_visibility(INTEGER, INTEGER);`)

        console.log('Migration 047 rolled back: Role visibility triggers removed')
    }
}
