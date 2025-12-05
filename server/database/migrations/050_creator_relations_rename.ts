/**
 * Migration 050: Rename owner_id → creator_id, r_owner → r_creator
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Sunrise Talk Dec 5, 2025 Decisions:
 * 1. "owner" → "creator" for record creators (historical fact, not possession)
 * 2. "roles" → "relations" in code (contextual relationships)
 * 3. Bits 17-19 repurposed for to_status (transitions)
 * 
 * This migration handles the database column renames.
 * Code refactoring (ROLE → RELATION constants) is separate.
 * 
 * Package: E (050-059) - Creator/Relations refactoring
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '050_creator_relations_rename',
    description: 'Rename owner_id → creator_id, r_owner → r_creator on entity tables',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 050 requires PostgreSQL')
        }

        console.log('Running migration 050: Creator/Relations rename...')

        // ===================================================================
        // POSTS TABLE
        // ===================================================================

        // Rename owner_id → creator_id
        await db.exec(`
            ALTER TABLE posts 
            RENAME COLUMN owner_id TO creator_id;
        `)

        // Rename r_owner → r_creator
        await db.exec(`
            ALTER TABLE posts 
            RENAME COLUMN r_owner TO r_creator;
        `)

        // Update index name
        await db.exec(`
            ALTER INDEX IF EXISTS idx_posts_owner_id RENAME TO idx_posts_creator_id;
        `)

        // ===================================================================
        // IMAGES TABLE
        // ===================================================================

        // Rename owner_id → creator_id
        await db.exec(`
            ALTER TABLE images 
            RENAME COLUMN owner_id TO creator_id;
        `)

        // Rename r_owner → r_creator
        await db.exec(`
            ALTER TABLE images 
            RENAME COLUMN r_owner TO r_creator;
        `)

        // Update index name if exists
        await db.exec(`
            ALTER INDEX IF EXISTS idx_images_owner_id RENAME TO idx_images_creator_id;
        `)

        // ===================================================================
        // PROJECTS TABLE
        // ===================================================================

        // Projects keep owner_id (legal ownership), but rename r_owner → r_creator
        // Note: projects.owner_id is the PROJECT owner (legal), stays as owner_id
        // But r_owner (visibility flag) becomes r_creator for consistency
        await db.exec(`
            ALTER TABLE projects 
            RENAME COLUMN r_owner TO r_creator;
        `)

        // ===================================================================
        // UPDATE VISIBILITY INDEXES
        // ===================================================================

        // Drop old visibility indexes
        await db.exec(`
            DROP INDEX IF EXISTS idx_posts_visibility;
            DROP INDEX IF EXISTS idx_images_visibility;
            DROP INDEX IF EXISTS idx_projects_visibility;
        `)

        // Create new visibility indexes with r_creator
        await db.exec(`
            CREATE INDEX idx_posts_visibility 
            ON posts(r_anonym, r_partner, r_participant, r_member, r_creator);
            
            CREATE INDEX idx_images_visibility 
            ON images(r_anonym, r_partner, r_participant, r_member, r_creator);
            
            CREATE INDEX idx_projects_visibility 
            ON projects(r_anonym, r_partner, r_participant, r_member, r_creator);
        `)

        // ===================================================================
        // UPDATE TRIGGER FUNCTION
        // ===================================================================

        // Update compute_role_visibility function to use r_creator
        await db.exec(`
            CREATE OR REPLACE FUNCTION compute_role_visibility()
            RETURNS TRIGGER AS $$
            DECLARE
                role_bits INTEGER;
                entity_type_code INTEGER;
                entity_state INTEGER;
            BEGIN
                -- Determine entity type code (matches sysreg_config bits 3-7)
                entity_type_code := CASE TG_TABLE_NAME
                    WHEN 'posts' THEN 4    -- ENTITY_POST = 0b00100
                    WHEN 'images' THEN 6   -- ENTITY_IMAGE = 0b00110
                    WHEN 'projects' THEN 1 -- ENTITY_PROJECT = 0b00001
                    ELSE 0
                END;
                
                -- Extract state from status (bits vary by entity, simplified here)
                -- For now, use status value directly and match against config entries
                entity_state := COALESCE(NEW.status, 0);
                
                -- Query sysreg_config for matching capability entries
                -- Extract role bits (25-29) from entries matching this entity+state
                SELECT COALESCE(bit_or(
                    ((c.config::jsonb->'sysreg'->>'value')::INTEGER >> 25) & 31
                ), 0) INTO role_bits
                FROM crearis_config c
                WHERE (c.config::jsonb->>'key') = 'sysreg'
                  AND (c.config::jsonb->'sysreg'->>'type') = 'config'
                  AND (c.config::jsonb->'sysreg'->>'tagfamily') = 'config'
                  -- Match entity type (bits 3-7)
                  AND (
                      (((c.config::jsonb->'sysreg'->>'value')::INTEGER >> 3) & 31) = entity_type_code
                      OR (((c.config::jsonb->'sysreg'->>'value')::INTEGER >> 3) & 31) = 0  -- all entities
                  )
                  -- Match state (bits 8-10) - check for specific state or "all states"
                  AND (
                      (((c.config::jsonb->'sysreg'->>'value')::INTEGER >> 8) & 7) = 0  -- all states
                      -- Add state-specific matching if needed
                  )
                  -- Only capability entries (to_status bits 17-19 = 0, not transitions)
                  AND (((c.config::jsonb->'sysreg'->>'value')::INTEGER >> 17) & 7) = 0;
                
                -- Set visibility flags from role bits
                NEW.r_anonym := (role_bits & 1) != 0;      -- bit 25 (shifted to 0)
                NEW.r_partner := (role_bits & 2) != 0;     -- bit 26 (shifted to 1)
                NEW.r_participant := (role_bits & 4) != 0; -- bit 27 (shifted to 2)
                NEW.r_member := (role_bits & 8) != 0;      -- bit 28 (shifted to 3)
                NEW.r_creator := (role_bits & 16) != 0;    -- bit 29 (shifted to 4)
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)

        // ===================================================================
        // UPDATE recompute_all_capabilities FUNCTION
        // ===================================================================

        await db.exec(`
            CREATE OR REPLACE FUNCTION recompute_all_capabilities()
            RETURNS TABLE (
                posts_updated INTEGER,
                images_updated INTEGER,
                projects_updated INTEGER,
                new_version INTEGER
            ) AS $$
            DECLARE
                v_posts INTEGER;
                v_images INTEGER;
                v_projects INTEGER;
                v_version INTEGER;
            BEGIN
                -- Touch all posts to trigger recomputation
                UPDATE posts SET status = status WHERE status IS NOT NULL;
                GET DIAGNOSTICS v_posts = ROW_COUNT;
                
                -- Touch all images to trigger recomputation
                UPDATE images SET status = status WHERE status IS NOT NULL;
                GET DIAGNOSTICS v_images = ROW_COUNT;
                
                -- Touch all projects to trigger recomputation
                UPDATE projects SET status = status WHERE status IS NOT NULL;
                GET DIAGNOSTICS v_projects = ROW_COUNT;
                
                -- Increment version in JSONB config
                UPDATE crearis_config 
                SET config = jsonb_set(
                    config, 
                    '{capabilities_version}', 
                    to_jsonb(COALESCE((config->>'capabilities_version')::integer, 0) + 1)
                )
                WHERE id = 1
                RETURNING (config->>'capabilities_version')::integer INTO v_version;
                
                posts_updated := v_posts;
                images_updated := v_images;
                projects_updated := v_projects;
                new_version := v_version;
                RETURN NEXT;
            END;
            $$ LANGUAGE plpgsql;
        `)

        console.log('Migration 050 complete: owner_id → creator_id, r_owner → r_creator')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 050 rollback requires PostgreSQL')
        }

        console.log('Rolling back migration 050...')

        // Reverse the renames
        await db.exec(`
            ALTER TABLE posts RENAME COLUMN creator_id TO owner_id;
            ALTER TABLE posts RENAME COLUMN r_creator TO r_owner;
            ALTER INDEX IF EXISTS idx_posts_creator_id RENAME TO idx_posts_owner_id;
            
            ALTER TABLE images RENAME COLUMN creator_id TO owner_id;
            ALTER TABLE images RENAME COLUMN r_creator TO r_owner;
            
            ALTER TABLE projects RENAME COLUMN r_creator TO r_owner;
        `)

        // Recreate old indexes
        await db.exec(`
            DROP INDEX IF EXISTS idx_posts_visibility;
            DROP INDEX IF EXISTS idx_images_visibility;
            DROP INDEX IF EXISTS idx_projects_visibility;
            
            CREATE INDEX idx_posts_visibility 
            ON posts(r_anonym, r_partner, r_participant, r_member, r_owner);
            
            CREATE INDEX idx_images_visibility 
            ON images(r_anonym, r_partner, r_participant, r_member, r_owner);
            
            CREATE INDEX idx_projects_visibility 
            ON projects(r_anonym, r_partner, r_participant, r_member, r_owner);
        `)

        console.log('Migration 050 rollback complete')
    }
}
