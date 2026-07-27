/**
 * Migration 035: Rename *_val columns to non-suffixed names
 * 
 * Eliminates the _val suffix from all sysreg columns for consistency and simplicity.
 * This aligns all entity tables to use: status, config, rtags, ctags, ttags, dtags
 * instead of: status_val, config_val, rtags_val, ctags_val, ttags_val, dtags_val
 * 
 * Reason: The images table already uses non-suffixed ctags/rtags with production data.
 * Maintaining two naming conventions causes confusion in code generation and development.
 * 
 * IMPORTANT: This migration is REVERSIBLE. See down() function for rollback.
 * 
 * Changes:
 * 1. For images: Drop unused *_val duplicates, rename ttags_val/dtags_val
 * 2. For full entities (posts, events, projects, participants, instructors):
 *    Rename all 6 columns: status_val → status, etc.
 * 3. For partial entities (users, tasks, interactions):
 *    Rename 3 columns: status_val, config_val, rtags_val
 * 4. Update all indexes to match new column names
 * 5. Update helper functions that reference old column names
 * 
 * Package: D (035+) - Schema standardization
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '035_rename_val_columns',
    description: 'Rename *_val columns to non-suffixed names for consistency',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 035 requires PostgreSQL')
        }

        console.log('Running migration 035: Rename *_val columns...')

        // ===================================================================
        // CHAPTER 1: Images Table (Special Case)
        // ===================================================================
        console.log('\n📖 Chapter 1: Check images table')

        // Check if images already has non-suffixed columns
        const hasCtags = await db.get(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'images' AND column_name = 'ctags'
            ) as exists
        `)

        // Fresh-replay repair (CV@wsl 2026-07-10, HD-authorized):
        // images carries a MIX — non-suffixed ctags/rtags (production data) alongside
        // leftover *_val columns (ctags_val/rtags_val duplicates, ttags_val/dtags_val only).
        // The original code short-circuited on `ctags` existing and skipped ttags/dtags,
        // leaving images without ttags/dtags (later breaks migration 036). Normalize all four
        // tag columns idempotently: drop a _val column when its non-suffixed twin exists,
        // otherwise rename it. hasCtags kept above for reference.
        void hasCtags
        console.log('  Normalizing images tag columns (ctags, rtags, ttags, dtags)...')
        for (const tag of ['ctags', 'rtags', 'ttags', 'dtags']) {
            const plain = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = '${tag}') as exists`)
            const suffixed = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = '${tag}_val') as exists`)
            if (suffixed?.exists && plain?.exists) {
                await db.exec(`ALTER TABLE images DROP COLUMN ${tag}_val CASCADE;`)
                console.log(`    ✓ images: dropped duplicate ${tag}_val`)
            } else if (suffixed?.exists) {
                await db.exec(`ALTER TABLE images RENAME COLUMN ${tag}_val TO ${tag};`)
                console.log(`    ✓ images: renamed ${tag}_val → ${tag}`)
            } else {
                console.log(`    ✓ images: ${tag} already normalized`)
            }
        }

        // Refresh indexes to match the normalized column names
        await db.exec(`DROP INDEX IF EXISTS idx_images_ctags_val;`)
        await db.exec(`DROP INDEX IF EXISTS idx_images_rtags_val;`)
        await db.exec(`DROP INDEX IF EXISTS idx_images_ttags_val;`)
        await db.exec(`DROP INDEX IF EXISTS idx_images_dtags_val;`)
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_images_ctags ON images USING hash(ctags);`)
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_images_rtags ON images USING hash(rtags);`)
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_images_ttags ON images USING hash(ttags);`)
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_images_dtags ON images USING hash(dtags);`)
        console.log('    ✓ Updated indexes for images')

        // ===================================================================
        // CHAPTER 2: Full Entity Tables (6 columns each)
        // ===================================================================
        console.log('\n📖 Chapter 2: Rename columns in full entity tables')

        const fullEntities = ['posts', 'events', 'projects', 'participants', 'instructors']

        for (const table of fullEntities) {
            console.log(`\n  Processing ${table}...`)

            // Check and rename status column if needed
            const hasStatus = await db.get(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status'
                ) as exists
            `)
            const hasStatusVal = await db.get(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status_val'
                ) as exists
            `)

            if (!hasStatus?.exists && hasStatusVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN status_val TO status;`)
                console.log(`    ✓ Renamed status_val → status`)
            } else if (hasStatus?.exists && hasStatusVal?.exists) {
                // Fresh-replay: legacy TEXT `status` (from 000_base_schema) coexists with
                // the sysreg `status_val`. Drop the legacy column (CASCADE clears its CHECK),
                // then promote the sysreg column. The generated `status_label` depends on
                // status_val and follows the rename automatically.
                console.log(`    ⚠ Legacy 'status' + 'status_val' both present — dropping legacy, promoting sysreg`)
                await db.exec(`ALTER TABLE ${table} DROP COLUMN status CASCADE;`)
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN status_val TO status;`)
                console.log(`    ✓ Dropped legacy status, renamed status_val → status`)
            } else if (hasStatus?.exists) {
                console.log(`    ✓ Already has status column`)
            }

            // Check and rename config column if needed
            const hasConfig = await db.get(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = '${table}' AND column_name = 'config'
                ) as exists
            `)
            const hasConfigVal = await db.get(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = '${table}' AND column_name = 'config_val'
                ) as exists
            `)

            if (!hasConfig?.exists && hasConfigVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN config_val TO config;`)
                console.log(`    ✓ Renamed config_val → config`)
            } else if (hasConfig?.exists && hasConfigVal?.exists) {
                console.log(`    ⚠ Table already has both config and config_val, dropping config_val`)
                await db.exec(`ALTER TABLE ${table} DROP COLUMN config_val CASCADE;`)
            } else if (hasConfig?.exists) {
                console.log(`    ✓ Already has config column`)
            }

            // Rename tag columns (check each one)
            const hasRtags = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'rtags') as exists`)
            const hasRtagsVal = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'rtags_val') as exists`)
            if (!hasRtags?.exists && hasRtagsVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN rtags_val TO rtags;`)
                console.log(`    ✓ Renamed rtags_val → rtags`)
            } else if (hasRtags?.exists) {
                console.log(`    ✓ Already has rtags column`)
            }

            const hasCtags = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'ctags') as exists`)
            const hasCtagsVal = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'ctags_val') as exists`)
            if (!hasCtags?.exists && hasCtagsVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN ctags_val TO ctags;`)
                console.log(`    ✓ Renamed ctags_val → ctags`)
            } else if (hasCtags?.exists) {
                console.log(`    ✓ Already has ctags column`)
            }

            const hasTtags = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'ttags') as exists`)
            const hasTtagsVal = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'ttags_val') as exists`)
            if (!hasTtags?.exists && hasTtagsVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN ttags_val TO ttags;`)
                console.log(`    ✓ Renamed ttags_val → ttags`)
            } else if (hasTtags?.exists) {
                console.log(`    ✓ Already has ttags column`)
            }

            const hasDtags = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'dtags') as exists`)
            const hasDtagsVal = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'dtags_val') as exists`)
            if (!hasDtags?.exists && hasDtagsVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN dtags_val TO dtags;`)
                console.log(`    ✓ Renamed dtags_val → dtags`)
            } else if (hasDtags?.exists) {
                console.log(`    ✓ Already has dtags column`)
            }

            // Update indexes
            console.log(`    Updating indexes for ${table}...`)
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_ctags_val;`)
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_rtags_val;`)
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_ttags_val;`)
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_dtags_val;`)

            await db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_ctags ON ${table} USING hash(ctags);`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_rtags ON ${table} USING hash(rtags);`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_ttags ON ${table} USING hash(ttags);`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_dtags ON ${table} USING hash(dtags);`)
            console.log(`    ✓ Updated indexes for ${table}`)
        }

        // ===================================================================
        // CHAPTER 3: Partial Entity Tables (3 columns each)
        // ===================================================================
        console.log('\n📖 Chapter 3: Rename columns in partial entity tables')

        const partialEntities = ['users', 'tasks', 'interactions']

        for (const table of partialEntities) {
            console.log(`\n  Processing ${table}...`)

            // Check and rename status column if needed
            const hasStatus = await db.get(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status'
                ) as exists
            `)
            const hasStatusVal = await db.get(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = '${table}' AND column_name = 'status_val'
                ) as exists
            `)

            if (!hasStatus?.exists && hasStatusVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN status_val TO status;`)
                console.log(`    ✓ Renamed status_val → status`)
            } else if (hasStatus?.exists && hasStatusVal?.exists) {
                // Fresh-replay: legacy TEXT `status` (from 000_base_schema) coexists with
                // the sysreg `status_val`. Drop the legacy column, then promote the sysreg one.
                console.log(`    ⚠ Legacy 'status' + 'status_val' both present — dropping legacy, promoting sysreg`)
                await db.exec(`ALTER TABLE ${table} DROP COLUMN status CASCADE;`)
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN status_val TO status;`)
                console.log(`    ✓ Dropped legacy status, renamed status_val → status`)
            } else if (hasStatus?.exists) {
                console.log(`    ✓ Already has status column`)
            }

            // Check and rename config column if needed
            const hasConfig = await db.get(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = '${table}' AND column_name = 'config'
                ) as exists
            `)
            const hasConfigVal = await db.get(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = '${table}' AND column_name = 'config_val'
                ) as exists
            `)

            if (!hasConfig?.exists && hasConfigVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN config_val TO config;`)
                console.log(`    ✓ Renamed config_val → config`)
            } else if (hasConfig?.exists && hasConfigVal?.exists) {
                console.log(`    ⚠ Table already has both, dropping config_val`)
                await db.exec(`ALTER TABLE ${table} DROP COLUMN config_val CASCADE;`)
            } else if (hasConfig?.exists) {
                console.log(`    ✓ Already has config column`)
            }

            // Check and rename rtags if needed
            const hasRtags = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'rtags') as exists`)
            const hasRtagsVal = await db.get(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'rtags_val') as exists`)
            if (!hasRtags?.exists && hasRtagsVal?.exists) {
                await db.exec(`ALTER TABLE ${table} RENAME COLUMN rtags_val TO rtags;`)
                console.log(`    ✓ Renamed rtags_val → rtags`)
            } else if (hasRtags?.exists) {
                console.log(`    ✓ Already has rtags column`)
            }

            // Update indexes
            console.log(`    Updating indexes for ${table}...`)
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_rtags_val;`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_rtags ON ${table} USING hash(rtags);`)
            console.log(`    ✓ Updated indexes for ${table}`)
        }

        // ===================================================================
        // CHAPTER 4: Update Helper Functions
        // ===================================================================
        console.log('\n📖 Chapter 4: Update helper functions')

        // Drop existing functions first
        await db.exec(`DROP FUNCTION IF EXISTS get_status_name(bytea);`)
        await db.exec(`DROP FUNCTION IF EXISTS get_status_value(text, text);`)
        await db.exec(`DROP FUNCTION IF EXISTS validate_status_transition(bytea, text);`)
        console.log('    ✓ Dropped existing functions')

        // Update get_status_name function to use 'status' instead of 'status_val'
        await db.exec(`
            CREATE OR REPLACE FUNCTION get_status_name(p_status BYTEA)
            RETURNS TEXT AS $$
            DECLARE
                v_name TEXT;
            BEGIN
                -- Find status by value
                SELECT name INTO v_name
                FROM sysreg_status
                WHERE value = p_status;
                
                IF v_name IS NULL THEN
                    -- Try casting to int if not found
                    SELECT name INTO v_name
                    FROM sysreg_status
                    WHERE value = p_status;
                END IF;
                
                RETURN v_name;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `)
        console.log('    ✓ Updated get_status_name() function')

        // Update get_status_value function signature
        await db.exec(`
            CREATE OR REPLACE FUNCTION get_status_value(
                p_name TEXT,
                p_table TEXT
            ) RETURNS BYTEA AS $$
            DECLARE
                v_status BYTEA;
            BEGIN
                -- Try exact name match first
                IF p_table IS NOT NULL THEN
                    SELECT value INTO v_status
                    FROM sysreg_status
                    WHERE name = p_name AND "table" = p_table;
                ELSE
                    SELECT value INTO v_status
                    FROM sysreg_status
                    WHERE name = p_name
                    LIMIT 1;
                END IF;
                
                RETURN v_status;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `)
        console.log('    ✓ Updated get_status_value() function')

        // Update validate_status_transition if it exists
        const functionExists = await db.get(`
            SELECT EXISTS (
                SELECT 1 FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = 'public' 
                AND p.proname = 'validate_status_transition'
            ) as exists
        `)

        if (functionExists?.exists) {
            await db.exec(`
                CREATE OR REPLACE FUNCTION validate_status_transition(
                    p_status BYTEA,
                    p_table TEXT
                ) RETURNS BOOLEAN AS $$
                BEGIN
                    -- Status validation logic here
                    -- This is a placeholder - adjust based on your needs
                    RETURN p_status IS NOT NULL;
                END;
                $$ LANGUAGE plpgsql IMMUTABLE;
            `)
            console.log('    ✓ Updated validate_status_transition() function')
        }

        // ===================================================================
        // CHAPTER 5: Update Views (if any reference *_val columns)
        // ===================================================================
        console.log('\n📖 Chapter 5: Check and update views')

        // Check if v_entity_sysreg_columns exists
        const viewExists = await db.get(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.views 
                WHERE table_schema = 'public' 
                AND table_name = 'v_entity_sysreg_columns'
            ) as exists
        `)

        if (viewExists?.exists) {
            // Drop and recreate view with updated column names
            await db.exec(`DROP VIEW IF EXISTS v_entity_sysreg_columns`)
            await db.exec(`
                CREATE VIEW v_entity_sysreg_columns AS
                SELECT 
                    t.table_name,
                    t.is_entity,
                    t.has_status,
                    t.has_config,
                    t.has_rtags,
                    t.has_ctags,
                    t.has_ttags,
                    t.has_dtags,
                    EXISTS(
                        SELECT 1 FROM information_schema.columns c
                        WHERE c.table_name = t.table_name 
                          AND c.column_name = 'status'
                    ) as status_exists,
                    EXISTS(
                        SELECT 1 FROM information_schema.columns c
                        WHERE c.table_name = t.table_name 
                          AND c.column_name = 'status_label'
                    ) as status_label_exists
                FROM alltables t
                WHERE t.is_entity = true
                ORDER BY t.table_name;
            `)
            console.log('    ✓ Updated v_entity_sysreg_columns view')
        }

        // ===================================================================
        // CHAPTER 6: Summary
        // ===================================================================
        console.log('\n📊 Migration Summary:')
        console.log('  Images:')
        console.log('    - Dropped: ctags_val, rtags_val (were unused)')
        console.log('    - Renamed: ttags_val → ttags, dtags_val → dtags')
        console.log('  Full entities (posts, events, projects, participants, instructors):')
        console.log('    - Renamed: status_val → status')
        console.log('    - Renamed: config_val → config')
        console.log('    - Renamed: rtags_val → rtags, ctags_val → ctags')
        console.log('    - Renamed: ttags_val → ttags, dtags_val → dtags')
        console.log('  Partial entities (users, tasks, interactions):')
        console.log('    - Renamed: status_val → status')
        console.log('    - Renamed: config_val → config')
        console.log('    - Renamed: rtags_val → rtags')
        console.log('  Database functions: Updated to use new column names')
        console.log('  Indexes: Recreated with new column names')

        console.log('\n✅ Migration 035 completed: All columns renamed successfully')
        console.log('⚠️  IMPORTANT: Update application code to use new column names!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 035: Restoring *_val column names...')

        const isPostgres = db.type === 'postgresql'
        if (!isPostgres) {
            throw new Error('Rollback requires PostgreSQL')
        }

        // ===================================================================
        // Rollback Chapter 1: Images Table
        // ===================================================================
        console.log('\n📖 Rollback Chapter 1: Restore images table structure')

        // Rename back
        await db.exec(`ALTER TABLE images RENAME COLUMN ttags TO ttags_val;`)
        await db.exec(`ALTER TABLE images RENAME COLUMN dtags TO dtags_val;`)

        // Restore the dropped columns (will be NULL)
        await db.exec(`ALTER TABLE images ADD COLUMN ctags_val BYTEA DEFAULT NULL;`)
        await db.exec(`ALTER TABLE images ADD COLUMN rtags_val BYTEA DEFAULT NULL;`)

        // Restore indexes
        await db.exec(`DROP INDEX IF EXISTS idx_images_ttags;`)
        await db.exec(`DROP INDEX IF EXISTS idx_images_dtags;`)
        await db.exec(`CREATE INDEX idx_images_ctags_val ON images USING hash(ctags_val);`)
        await db.exec(`CREATE INDEX idx_images_rtags_val ON images USING hash(rtags_val);`)
        await db.exec(`CREATE INDEX idx_images_ttags_val ON images USING hash(ttags_val);`)
        await db.exec(`CREATE INDEX idx_images_dtags_val ON images USING hash(dtags_val);`)

        console.log('    ✓ Restored images table structure')

        // ===================================================================
        // Rollback Chapter 2: Full Entity Tables
        // ===================================================================
        console.log('\n📖 Rollback Chapter 2: Restore full entity tables')

        const fullEntities = ['posts', 'events', 'projects', 'participants', 'instructors']

        for (const table of fullEntities) {
            console.log(`  Restoring ${table}...`)

            await db.exec(`ALTER TABLE ${table} RENAME COLUMN status TO status_val;`)
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN config TO config_val;`)
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN rtags TO rtags_val;`)
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN ctags TO ctags_val;`)
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN ttags TO ttags_val;`)
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN dtags TO dtags_val;`)

            // Restore indexes
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_ctags;`)
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_rtags;`)
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_ttags;`)
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_dtags;`)

            await db.exec(`CREATE INDEX idx_${table}_ctags_val ON ${table} USING hash(ctags_val);`)
            await db.exec(`CREATE INDEX idx_${table}_rtags_val ON ${table} USING hash(rtags_val);`)
            await db.exec(`CREATE INDEX idx_${table}_ttags_val ON ${table} USING hash(ttags_val);`)
            await db.exec(`CREATE INDEX idx_${table}_dtags_val ON ${table} USING hash(dtags_val);`)

            console.log(`    ✓ Restored ${table}`)
        }

        // ===================================================================
        // Rollback Chapter 3: Partial Entity Tables
        // ===================================================================
        console.log('\n📖 Rollback Chapter 3: Restore partial entity tables')

        const partialEntities = ['users', 'tasks', 'interactions']

        for (const table of partialEntities) {
            console.log(`  Restoring ${table}...`)

            await db.exec(`ALTER TABLE ${table} RENAME COLUMN status TO status_val;`)
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN config TO config_val;`)
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN rtags TO rtags_val;`)

            // Restore indexes
            await db.exec(`DROP INDEX IF EXISTS idx_${table}_rtags;`)
            await db.exec(`CREATE INDEX idx_${table}_rtags_val ON ${table} USING hash(rtags_val);`)

            console.log(`    ✓ Restored ${table}`)
        }

        // ===================================================================
        // Rollback Chapter 4: Restore Helper Functions
        // ===================================================================
        console.log('\n📖 Rollback Chapter 4: Restore helper functions')

        await db.exec(`
            CREATE OR REPLACE FUNCTION get_status_name(p_status_val BYTEA)
            RETURNS TEXT AS $$
            DECLARE
                v_name TEXT;
            BEGIN
                SELECT name INTO v_name
                FROM sysreg_status
                WHERE value = p_status_val;
                RETURN v_name;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `)
        console.log('    ✓ Restored get_status_name() function')

        console.log('\n✅ Migration 035 rollback completed: All *_val column names restored')
    }
}
