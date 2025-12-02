/**
 * Migration 048: Capabilities version and recompute function
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Adds capabilities_version to crearis_config JSONB for tracking config changes.
 * Creates recompute_all_capabilities() function for manual re-runs.
 * 
 * Note: crearis_config uses JSONB structure: { id: 1, config: { migrations_run: [...], capabilities_version: N } }
 * 
 * Use cases:
 * - After updating sysreg_config entries via CapabilitiesEditor
 * - After deploying new config rules
 * - For debugging/testing
 * 
 * Package: D (040-049) - Auth system refactoring
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '048_capabilities_recompute',
    description: 'Add capabilities version tracking and recompute function',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 048 requires PostgreSQL')
        }

        console.log('Running migration 048: Capabilities recompute function...')

        // Add capabilities_version to crearis_config JSONB (id=1 row)
        await db.exec(`
            UPDATE crearis_config 
            SET config = config || '{"capabilities_version": 1}'::jsonb
            WHERE id = 1 AND NOT (config ? 'capabilities_version');
        `)

        // Create recompute function
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

        // Create function to recompute single entity type
        await db.exec(`
            CREATE OR REPLACE FUNCTION recompute_entity_capabilities(p_entity_type TEXT)
            RETURNS INTEGER AS $$
            DECLARE
                v_count INTEGER;
            BEGIN
                CASE p_entity_type
                    WHEN 'posts' THEN
                        UPDATE posts SET status = status WHERE status IS NOT NULL;
                    WHEN 'images' THEN
                        UPDATE images SET status = status WHERE status IS NOT NULL;
                    WHEN 'projects' THEN
                        UPDATE projects SET status = status WHERE status IS NOT NULL;
                    ELSE
                        RAISE EXCEPTION 'Unknown entity type: %', p_entity_type;
                END CASE;
                
                GET DIAGNOSTICS v_count = ROW_COUNT;
                RETURN v_count;
            END;
            $$ LANGUAGE plpgsql;
        `)

        // Create function to recompute for a specific project
        await db.exec(`
            CREATE OR REPLACE FUNCTION recompute_project_capabilities(p_project_id INTEGER)
            RETURNS TABLE (
                posts_updated INTEGER,
                images_updated INTEGER
            ) AS $$
            DECLARE
                v_posts INTEGER;
                v_images INTEGER;
            BEGIN
                -- Touch all posts in this project
                UPDATE posts SET status = status 
                WHERE project_id = p_project_id AND status IS NOT NULL;
                GET DIAGNOSTICS v_posts = ROW_COUNT;
                
                -- Touch all images in this project
                UPDATE images SET status = status 
                WHERE project_id = p_project_id AND status IS NOT NULL;
                GET DIAGNOSTICS v_images = ROW_COUNT;
                
                posts_updated := v_posts;
                images_updated := v_images;
                
                RETURN NEXT;
            END;
            $$ LANGUAGE plpgsql;
        `)

        console.log('Migration 048 complete: Recompute functions created')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 048 rollback requires PostgreSQL')
        }

        await db.exec(`DROP FUNCTION IF EXISTS recompute_all_capabilities();`)
        await db.exec(`DROP FUNCTION IF EXISTS recompute_entity_capabilities(TEXT);`)
        await db.exec(`DROP FUNCTION IF EXISTS recompute_project_capabilities(INTEGER);`)
        
        // Remove capabilities_version from JSONB config
        await db.exec(`
            UPDATE crearis_config 
            SET config = config - 'capabilities_version'
            WHERE id = 1;
        `)

        console.log('Migration 048 rolled back: Recompute functions removed')
    }
}
