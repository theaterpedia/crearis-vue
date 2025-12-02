/**
 * Migration 036: Convert sysreg from BYTEA to INTEGER
 * 
 * MAJOR REFACTOR - DESTRUCTIVE MIGRATION
 * 
 * Changes:
 * 1. sysreg.value: BYTEA → INTEGER (32-bit)
 * 2. All entity table sysreg columns: BYTEA → INTEGER
 * 3. Clears all entity sysreg data (status, config, *tags)
 * 
 * Benefits:
 * - Standardized 32-bit capacity (vs 8-bit practical limit)
 * - Better PostgreSQL indexing performance
 * - Simpler JavaScript bitwise operations
 * - Cleaner integer values for debugging
 * 
 * Data Impact:
 * ✅ Keeps: sysreg metadata (tag definitions)
 * ❌ Deletes: All entity sysreg field values
 * 
 * Package: C (036-039) - Major refactor
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '036_bytea_to_integer',
    description: 'Convert sysreg from BYTEA to INTEGER (32-bit) and clear entity data',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 036 requires PostgreSQL.')
        }

        console.log('Running migration 036: Convert sysreg BYTEA → INTEGER...')
        console.log('⚠️  WARNING: This migration will DELETE all entity sysreg data!')
        console.log('    Data will be recreated systematically after migration.')

        // ===================================================================
        // CHAPTER 1: Backup Current sysreg Metadata
        // ===================================================================
        console.log('\n📖 Chapter 1: Backup sysreg metadata')

        const sysregEntries = await db.all('SELECT * FROM sysreg ORDER BY id', [])
        console.log(`  ✓ Backed up ${(sysregEntries as any[]).length} sysreg entries`)

        // ===================================================================
        // CHAPTER 2: Alter sysreg Table Structure
        // ===================================================================
        console.log('\n📖 Chapter 2: Alter sysreg table to INTEGER')

        // Step 2.1: Drop constraints and indexes
        console.log('\n  🔧 Dropping constraints and indexes...')

        await db.exec(`
            ALTER TABLE sysreg DROP CONSTRAINT IF EXISTS unique_value_family;
        `)
        console.log('    ✓ Dropped unique_value_family constraint')

        await db.exec(`
            DROP INDEX IF EXISTS idx_sysreg_value;
        `)
        console.log('    ✓ Dropped idx_sysreg_value index')

        // Step 2.2: Convert BYTEA values to INTEGER
        console.log('\n  🔄 Converting BYTEA values to INTEGER...')

        // For each sysreg entry, convert BYTEA to INTEGER
        // BYTEA \\x01 → INTEGER 1
        // BYTEA \\x02 → INTEGER 2
        // BYTEA \\x04 → INTEGER 4
        // etc.

        for (const entry of sysregEntries as any[]) {
            let intValue = 0

            // Parse BYTEA value
            if (entry.value) {
                const buffer = entry.value
                if (Buffer.isBuffer(buffer)) {
                    // Convert first byte to integer
                    // For single-byte BYTEA like \\x01, \\x02, etc.
                    intValue = buffer[0] || 0
                } else if (typeof buffer === 'string') {
                    // Handle string representation
                    const hex = buffer.replace(/^\\x/, '')
                    intValue = parseInt(hex.substring(0, 2), 16) || 0
                }
            }

            // Update entry with temporary negative value (to avoid conflicts)
            await db.run(
                'UPDATE sysreg SET value = $1 WHERE id = $2',
                [-1 * (entry.id as number), entry.id]
            )
        }
        console.log('    ✓ Converted values to temporary negative integers')

        // Step 2.3: Drop dependent views temporarily
        console.log('\n  🔧 Dropping dependent views...')

        await db.exec(`DROP VIEW IF EXISTS v_all_tags CASCADE;`)
        await db.exec(`DROP VIEW IF EXISTS v_status CASCADE;`)
        console.log('    ✓ Dropped dependent views')

        // Step 2.3.5: Update get_sysreg_label function to use INTEGER
        console.log('\n  🔧 Updating get_sysreg_label function...')

        await db.exec(`DROP FUNCTION IF EXISTS get_sysreg_label(bytea, text, text);`)

        await db.exec(`
            CREATE OR REPLACE FUNCTION get_sysreg_label(
                p_value INTEGER,
                p_tagfamily TEXT,
                p_lang TEXT DEFAULT 'en'
            ) RETURNS TEXT AS $$
            DECLARE
                v_name_i18n JSONB;
                v_name TEXT;
            BEGIN
                IF p_value IS NULL THEN
                    RETURN NULL;
                END IF;
                
                SELECT name_i18n, name
                INTO v_name_i18n, v_name
                FROM sysreg
                WHERE value = p_value 
                  AND tagfamily = p_tagfamily
                LIMIT 1;
                
                IF v_name_i18n IS NOT NULL AND v_name_i18n ? p_lang THEN
                    RETURN v_name_i18n ->> p_lang;
                ELSE
                    RETURN v_name;
                END IF;
            END;
            $$ LANGUAGE plpgsql STABLE;
        `)
        console.log('    ✓ Updated get_sysreg_label function to use INTEGER')

        // Step 2.4: Alter column type
        console.log('\n  🔧 Altering column type...')

        // Drop value_int if exists (from failed previous attempt)
        await db.exec(`ALTER TABLE sysreg DROP COLUMN IF EXISTS value_int;`)

        // Create temporary integer column
        await db.exec(`
            ALTER TABLE sysreg ADD COLUMN value_int INTEGER;
        `)

        // Copy converted values to new column
        for (const entry of sysregEntries as any[]) {
            let intValue = 0

            if (entry.value) {
                const buffer = entry.value
                if (Buffer.isBuffer(buffer)) {
                    intValue = buffer[0] || 0
                } else if (typeof buffer === 'string') {
                    const hex = buffer.replace(/^\\x/, '')
                    intValue = parseInt(hex.substring(0, 2), 16) || 0
                }
            }

            await db.run(
                'UPDATE sysreg SET value_int = $1 WHERE id = $2',
                [intValue, entry.id]
            )
        }

        // Drop old column and rename new one
        await db.exec(`
            ALTER TABLE sysreg DROP COLUMN value;
        `)

        await db.exec(`
            ALTER TABLE sysreg RENAME COLUMN value_int TO value;
        `)

        await db.exec(`
            ALTER TABLE sysreg ALTER COLUMN value SET NOT NULL;
        `)

        console.log('    ✓ Changed value column to INTEGER')

        // Step 2.5: Recreate constraints and indexes
        console.log('\n  🔧 Recreating constraints and indexes...')

        await db.exec(`
            ALTER TABLE sysreg ADD CONSTRAINT unique_value_family UNIQUE (value, tagfamily);
        `)
        console.log('    ✓ Created unique_value_family constraint')

        await db.exec(`
            CREATE INDEX idx_sysreg_value ON sysreg (value);
        `)
        console.log('    ✓ Created idx_sysreg_value index')

        // ===================================================================
        // CHAPTER 3: Clear All Entity Sysreg Data
        // ===================================================================
        console.log('\n📖 Chapter 3: Clear all entity sysreg data')
        console.log('  ⚠️  DESTRUCTIVE: Deleting all status, config, and tag values...')

        // Tables with full sysreg columns (status, config, all tags)
        const fullTables = ['posts', 'events', 'projects', 'participants', 'instructors']
        for (const table of fullTables) {
            await db.exec(`
                UPDATE ${table} SET 
                    status = NULL,
                    config = NULL,
                    rtags = NULL,
                    ctags = NULL,
                    ttags = NULL,
                    dtags = NULL
            `)
            console.log(`    ✓ Cleared ${table}`)
        }

        // Users table (status, config, rtags only)
        await db.exec(`UPDATE users SET status = NULL, config = NULL, rtags = NULL`)
        console.log('    ✓ Cleared users')

        // Tasks table (status, config, rtags only)
        await db.exec(`UPDATE tasks SET status = NULL, config = NULL, rtags = NULL`)
        console.log('    ✓ Cleared tasks')

        // Interactions table (status, config, rtags only)
        await db.exec(`UPDATE interactions SET status = NULL, config = NULL, rtags = NULL`)
        console.log('    ✓ Cleared interactions')

        // Images table (tags only, no status/config)
        await db.exec(`
            UPDATE images SET
                ctags = NULL,
                rtags = NULL,
                ttags = NULL,
                dtags = NULL
        `)
        console.log('    ✓ Cleared images')

        // ===================================================================
        // CHAPTER 4: Alter Entity Table Columns
        // ===================================================================
        console.log('\n📖 Chapter 4: Alter entity table columns to INTEGER')

        // Step 4.1: Drop all triggers that reference sysreg columns
        console.log('\n  🔧 Dropping triggers temporarily...')

        const triggers = [
            { name: 'trg_validate_event_status', table: 'events' },
            { name: 'trigger_check_interactions_status', table: 'interactions' },
        ]

        for (const { name, table } of triggers) {
            await db.exec(`DROP TRIGGER IF EXISTS ${name} ON ${table} CASCADE;`)
        }
        console.log('    ✓ Dropped triggers')

        // Step 4.2: Alter columns to INTEGER
        console.log('\n  🔧 Altering entity columns to INTEGER...')

        // Handle posts, events, participants, instructors (no generated columns on config)
        const simpleFullTables = ['posts', 'events', 'participants', 'instructors']
        for (const table of simpleFullTables) {
            console.log(`\n  🔧 Converting ${table}...`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN status TYPE INTEGER USING NULL;`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN config TYPE INTEGER USING NULL;`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN rtags TYPE INTEGER USING NULL;`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN ctags TYPE INTEGER USING NULL;`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN ttags TYPE INTEGER USING NULL;`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN dtags TYPE INTEGER USING NULL;`)
            console.log(`    ✓ Converted ${table} columns to INTEGER`)
        }

        // Handle projects (has generated columns that depend on config)
        console.log(`\n  🔧 Converting projects...`)

        // Drop generated columns that depend on config
        // These will be recreated later with the new INTEGER-based config system
        // See: docs/tasks/2025-11-27-postmigration-tasks.md
        await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS is_onepage;`)
        await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS is_service;`)
        await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS is_sidebar;`)
        console.log(`    ⚠️  Dropped generated columns (is_onepage, is_service, is_sidebar)`)

        // Alter columns
        await db.exec(`ALTER TABLE projects ALTER COLUMN status TYPE INTEGER USING NULL;`)
        await db.exec(`ALTER TABLE projects ALTER COLUMN config TYPE INTEGER USING NULL;`)
        await db.exec(`ALTER TABLE projects ALTER COLUMN rtags TYPE INTEGER USING NULL;`)
        await db.exec(`ALTER TABLE projects ALTER COLUMN ctags TYPE INTEGER USING NULL;`)
        await db.exec(`ALTER TABLE projects ALTER COLUMN ttags TYPE INTEGER USING NULL;`)
        await db.exec(`ALTER TABLE projects ALTER COLUMN dtags TYPE INTEGER USING NULL;`)

        console.log(`    ✓ Converted projects columns to INTEGER`)
        console.log(`    ⚠️  Generated columns need recreation - see post-migration tasks`)        // Partial tables (status, config, rtags only)
        const partialTables = ['users', 'tasks', 'interactions']
        for (const table of partialTables) {
            console.log(`\n  🔧 Converting ${table}...`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN status TYPE INTEGER USING NULL;`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN config TYPE INTEGER USING NULL;`)
            await db.exec(`ALTER TABLE ${table} ALTER COLUMN rtags TYPE INTEGER USING NULL;`)
            console.log(`    ✓ Converted ${table} columns to INTEGER`)
        }

        // Images table (tags only, no status/config)
        console.log('\n  🔧 Converting images...')

        // Drop defaults that can't be auto-cast
        await db.exec(`ALTER TABLE images ALTER COLUMN ctags DROP DEFAULT;`)
        await db.exec(`ALTER TABLE images ALTER COLUMN rtags DROP DEFAULT;`)

        await db.exec(`ALTER TABLE images ALTER COLUMN ctags TYPE INTEGER USING NULL;`)
        await db.exec(`ALTER TABLE images ALTER COLUMN rtags TYPE INTEGER USING NULL;`)
        await db.exec(`ALTER TABLE images ALTER COLUMN ttags TYPE INTEGER USING NULL;`)
        await db.exec(`ALTER TABLE images ALTER COLUMN dtags TYPE INTEGER USING NULL;`)

        // Recreate defaults as INTEGER
        await db.exec(`ALTER TABLE images ALTER COLUMN ctags SET DEFAULT 0;`)
        await db.exec(`ALTER TABLE images ALTER COLUMN rtags SET DEFAULT 0;`)

        console.log('    ✓ Converted images columns to INTEGER')

        // Step 4.3: Recreate triggers with INTEGER parameters
        console.log('\n  🔧 Recreating triggers...')

        // Recreate trg_validate_event_status
        await db.exec(`
            CREATE OR REPLACE FUNCTION validate_event_status()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.status IS NOT NULL THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM sysreg 
                        WHERE value = NEW.status AND tagfamily = 'status'
                    ) THEN
                        RAISE EXCEPTION 'Invalid status value for events';
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_validate_event_status
                BEFORE INSERT OR UPDATE ON events
                FOR EACH ROW
                EXECUTE FUNCTION validate_event_status();
        `)

        // Recreate trigger_check_interactions_status
        await db.exec(`
            CREATE OR REPLACE FUNCTION check_interactions_status()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.status IS NOT NULL THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM sysreg 
                        WHERE value = NEW.status AND tagfamily = 'status'
                    ) THEN
                        RAISE EXCEPTION 'Invalid status value for interactions';
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trigger_check_interactions_status
                BEFORE INSERT OR UPDATE ON interactions
                FOR EACH ROW
                EXECUTE FUNCTION check_interactions_status();
        `)

        console.log('    ✓ Recreated triggers')

        // ===================================================================
        // CHAPTER 5: Verification
        // ===================================================================
        console.log('\n📖 Chapter 5: Verification')

        const sysregCheck = await db.get(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sysreg' AND column_name = 'value'
        `, [])

        if ((sysregCheck as any)?.data_type === 'integer') {
            console.log('  ✓ sysreg.value is INTEGER')
        } else {
            throw new Error('sysreg.value is not INTEGER!')
        }

        const postsCheck = await db.get(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'status'
        `, [])

        if ((postsCheck as any)?.data_type === 'integer') {
            console.log('  ✓ Entity columns are INTEGER')
        } else {
            throw new Error('Entity columns are not INTEGER!')
        }

        const sysregCount = await db.get('SELECT COUNT(*) as count FROM sysreg', [])
        console.log(`  ✓ Preserved ${(sysregCount as any).count} sysreg metadata entries`)

        console.log('\n✅ Migration 036 completed successfully!')
        console.log('   Next steps:')
        console.log('   1. Update frontend composable (useSysregTags.ts)')
        console.log('   2. Update test helpers and mock data')
        console.log('   3. Recreate entity sysreg data systematically')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 036 DOWN: Convert INTEGER → BYTEA...')
        console.log('⚠️  WARNING: This will convert back to BYTEA format')

        // ===================================================================
        // Reverse Chapter 4: Convert entity columns back to BYTEA
        // ===================================================================
        console.log('\n📖 Reverting entity table columns to BYTEA')

        const entityTables = [
            'posts',
            'events',
            'projects',
            'participants',
            'instructors',
            'users',
            'tasks',
            'interactions'
        ]

        for (const table of entityTables) {
            console.log(`  🔧 Converting ${table}...`)

            await db.exec(`
                ALTER TABLE ${table} ALTER COLUMN status TYPE BYTEA USING NULL;
            `)

            await db.exec(`
                ALTER TABLE ${table} ALTER COLUMN config TYPE BYTEA USING NULL;
            `)

            await db.exec(`
                ALTER TABLE ${table} ALTER COLUMN rtags TYPE BYTEA USING NULL;
            `)

            await db.exec(`
                ALTER TABLE ${table} ALTER COLUMN ctags TYPE BYTEA USING NULL;
            `)

            await db.exec(`
                ALTER TABLE ${table} ALTER COLUMN ttags TYPE BYTEA USING NULL;
            `)

            await db.exec(`
                ALTER TABLE ${table} ALTER COLUMN dtags TYPE BYTEA USING NULL;
            `)

            console.log(`    ✓ Converted ${table} back to BYTEA`)
        }

        // Images table
        await db.exec(`
            ALTER TABLE images ALTER COLUMN ctags TYPE BYTEA USING NULL;
        `)
        await db.exec(`
            ALTER TABLE images ALTER COLUMN rtags TYPE BYTEA USING NULL;
        `)
        await db.exec(`
            ALTER TABLE images ALTER COLUMN ttags TYPE BYTEA USING NULL;
        `)
        await db.exec(`
            ALTER TABLE images ALTER COLUMN dtags TYPE BYTEA USING NULL;
        `)
        console.log('    ✓ Converted images back to BYTEA')

        // ===================================================================
        // Reverse Chapter 2: Convert sysreg.value back to BYTEA
        // ===================================================================
        console.log('\n📖 Reverting sysreg.value to BYTEA')

        // Drop constraints
        await db.exec(`
            ALTER TABLE sysreg DROP CONSTRAINT IF EXISTS unique_value_family;
        `)

        await db.exec(`
            DROP INDEX IF EXISTS idx_sysreg_value;
        `)

        // Get current values
        const sysregEntries = await db.all('SELECT id, value FROM sysreg', [])

        // Convert to temporary values
        for (const entry of sysregEntries as any[]) {
            await db.run(
                'UPDATE sysreg SET value = $1 WHERE id = $2',
                [-1 * entry.id, entry.id]
            )
        }

        // Change column type
        await db.exec(`
            ALTER TABLE sysreg ALTER COLUMN value TYPE BYTEA USING NULL;
        `)

        // Convert INTEGER values back to BYTEA
        for (const entry of sysregEntries as any[]) {
            const intValue = entry.value || 0
            const hex = intValue.toString(16).padStart(2, '0')
            const byteaValue = `\\x${hex}`

            await db.run(
                `UPDATE sysreg SET value = $1 WHERE id = $2`,
                [Buffer.from(hex, 'hex'), entry.id]
            )
        }

        // Recreate constraints
        await db.exec(`
            ALTER TABLE sysreg ADD CONSTRAINT unique_value_family UNIQUE (value, tagfamily);
        `)

        await db.exec(`
            CREATE INDEX idx_sysreg_value ON sysreg USING hash (value);
        `)

        console.log('\n✅ Migration 036 DOWN completed')
        console.log('   sysreg and entity columns restored to BYTEA')
    }
}
