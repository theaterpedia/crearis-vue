/**
 * Migration 022: Create sysreg Core Table
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Creates unified sysreg table for status and tags with:
 * - BYTEA values for unlimited bitmask capacity
 * - tagfamily classification (status, config, rtags, ctags, ttags, dtags)
 * - taglogic types (category, subcategory, option, toggle)
 * - Full i18n support (name_i18n, desc_i18n JSONB)
 * - is_default flag for required categories
 * 
 * Migrates data from existing status and tags tables.
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '022_create_sysreg',
    description: 'Create sysreg core table with BYTEA values and tagfamily classification',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 022 requires PostgreSQL. SQLite support dropped from migration 019+.')
        }

        console.log('Running migration 022: Create sysreg core table...')

        // ===================================================================
        // CHAPTER 1: Create sysreg Core Table
        // ===================================================================
        console.log('\n📖 Chapter 1: Create sysreg Core Table')

        // -------------------------------------------------------------------
        // 1.1: Create sysreg table with BYTEA values
        // -------------------------------------------------------------------
        console.log('\n  🏗️  Creating sysreg table...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sysreg (
                id SERIAL PRIMARY KEY,
                value BYTEA NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                name_i18n JSONB,
                desc_i18n JSONB,
                taglogic TEXT NOT NULL CHECK (
                    taglogic IN ('category', 'subcategory', 'option', 'toggle')
                ),
                is_default BOOLEAN DEFAULT FALSE,
                tagfamily TEXT NOT NULL CHECK (
                    tagfamily IN ('status', 'config', 'rtags', 'ctags', 'ttags', 'dtags')
                ),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_value_family UNIQUE (value, tagfamily)
            )
        `)

        console.log('    ✓ Created sysreg table with BYTEA values')

        // -------------------------------------------------------------------
        // 1.2: Create indexes for sysreg
        // -------------------------------------------------------------------
        console.log('\n  📇 Creating indexes...')

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sysreg_name 
            ON sysreg(name)
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sysreg_tagfamily 
            ON sysreg(tagfamily)
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sysreg_value 
            ON sysreg USING hash (value)
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sysreg_name_family 
            ON sysreg(name, tagfamily)
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sysreg_taglogic 
            ON sysreg(taglogic)
        `)

        console.log('    ✓ Created indexes on sysreg')

        // ===================================================================
        // CHAPTER 2: Migrate Data from Status Table
        // ===================================================================
        console.log('\n📖 Chapter 2: Migrate Data from Status Table')

        // -------------------------------------------------------------------
        // 2.1: Convert SMALLINT values to BYTEA
        // -------------------------------------------------------------------
        console.log('\n  🔄 Converting status values to BYTEA...')

        // Get all existing status entries
        const statusEntries = await db.all(`
            SELECT 
                id,
                value,
                name,
                "table",
                description,
                name_i18n,
                desc_i18n
            FROM status
            ORDER BY "table", value
        `)

        console.log(`    ℹ️  Found ${statusEntries.length} status entries to migrate`)

        // -------------------------------------------------------------------
        // 2.2: Insert into sysreg with inferred taglogic
        // -------------------------------------------------------------------
        console.log('\n  💾 Inserting status entries into sysreg...')

        let insertCount = 0
        for (const entry of statusEntries) {
            // Convert SMALLINT to BYTEA (2 bytes, big-endian)
            const valueBytes = Buffer.alloc(2)
            valueBytes.writeUInt16BE(entry.value, 0)

            // Infer taglogic based on name pattern
            let taglogic = 'category'
            if (entry.name.includes(' > ')) {
                taglogic = 'subcategory'
            }

            // Determine is_default (value 0 or name contains 'new'/'all'/'default')
            const isDefault = entry.value === 0 ||
                ['new', 'all', 'default'].includes(entry.name.toLowerCase())

            // Build entity-specific name (table prefix for context)
            // e.g., 'draft' for events becomes 'events > draft'
            const contextName = `${entry.table} > ${entry.name}`

            try {
                await db.run(`
                    INSERT INTO sysreg (
                        value, 
                        name, 
                        description, 
                        name_i18n, 
                        desc_i18n, 
                        taglogic, 
                        is_default, 
                        tagfamily
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (value, tagfamily) DO NOTHING
                `, [
                    valueBytes,
                    contextName,
                    entry.description || '',
                    entry.name_i18n ? JSON.stringify(entry.name_i18n) : '{}',
                    entry.desc_i18n ? JSON.stringify(entry.desc_i18n) : '{}',
                    taglogic,
                    isDefault,
                    'status'
                ])
                insertCount++
            } catch (error) {
                console.warn(`    ⚠️  Skipped duplicate: ${contextName} (value: ${entry.value})`)
            }
        }

        console.log(`    ✓ Inserted ${insertCount} status entries into sysreg`)

        // -------------------------------------------------------------------
        // 2.3: Create lookup function for byte-value based queries
        // -------------------------------------------------------------------
        console.log('\n  🔧 Creating byte-value lookup functions...')

        await db.exec(`
            CREATE OR REPLACE FUNCTION get_sysreg_label(
                p_value BYTEA,
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

                -- Check for reserved unset value (0x00)
                IF p_value = '\\x00'::bytea THEN
                    RETURN 'unset';
                END IF;

                -- Get name_i18n from sysreg table
                SELECT name_i18n, name INTO v_name_i18n, v_name
                FROM sysreg
                WHERE value = p_value 
                  AND tagfamily = p_tagfamily
                LIMIT 1;

                -- If not found, return hex representation
                IF v_name IS NULL THEN
                    RETURN '0x' || encode(p_value, 'hex');
                END IF;

                -- Try to get translated name, fallback chain: lang → de → en → name
                RETURN COALESCE(
                    v_name_i18n->>p_lang,
                    v_name_i18n->>'de',
                    v_name_i18n->>'en',
                    v_name
                );
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `)

        await db.exec(`
            CREATE OR REPLACE FUNCTION get_sysreg_desc(
                p_value BYTEA,
                p_tagfamily TEXT,
                p_lang TEXT DEFAULT 'en'
            ) RETURNS TEXT AS $$
            DECLARE
                v_desc_i18n JSONB;
                v_description TEXT;
            BEGIN
                IF p_value IS NULL THEN
                    RETURN NULL;
                END IF;

                -- Get desc_i18n from sysreg table
                SELECT desc_i18n, description INTO v_desc_i18n, v_description
                FROM sysreg
                WHERE value = p_value 
                  AND tagfamily = p_tagfamily
                LIMIT 1;

                -- If not found, return NULL
                IF v_description IS NULL THEN
                    RETURN NULL;
                END IF;

                -- Try to get translated description, fallback chain
                RETURN COALESCE(
                    v_desc_i18n->>p_lang,
                    v_desc_i18n->>'de',
                    v_desc_i18n->>'en',
                    v_description
                );
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `)

        console.log('    ✓ Created lookup functions for byte-value queries')

        // ===================================================================
        // CHAPTER 3: Migrate Tags Table Structure
        // ===================================================================
        console.log('\n📖 Chapter 3: Migrate Tags Table Structure')

        // -------------------------------------------------------------------
        // 3.1: Check if tags table has data
        // -------------------------------------------------------------------
        console.log('\n  🔍 Checking tags table...')

        const tagsCount = await db.get(`
            SELECT COUNT(*) as count FROM tags
        `)

        console.log(`    ℹ️  Found ${(tagsCount as any).count} tags entries`)

        if ((tagsCount as any).count > 0) {
            // -------------------------------------------------------------------
            // 3.2: Migrate tags to sysreg with sequential BYTEA values
            // -------------------------------------------------------------------
            console.log('\n  🔄 Migrating tags to sysreg...')

            const tagsEntries = await db.all(`
                SELECT 
                    id,
                    name,
                    description,
                    name_i18n,
                    desc_i18n
                FROM tags
                ORDER BY id
            `)

            let tagInsertCount = 0
            let currentValue = 1  // Start from 1 (0 reserved for unset)

            for (const tag of tagsEntries) {
                // Allocate sequential power-of-2 values
                const valueBytes = Buffer.alloc(2)
                valueBytes.writeUInt16BE(currentValue, 0)

                // Infer tagfamily (currently all → ctags as user indicated)
                let tagfamily = 'ctags'

                // Classify based on name patterns
                if (/^is[A-Z]|^has[A-Z]|system|internal/i.test(tag.name)) {
                    tagfamily = 'rtags'
                }

                // Infer taglogic
                let taglogic = 'toggle'  // Default for tags
                if (/age|child|teen|adult|subject|access|type/i.test(tag.name)) {
                    taglogic = 'option'  // Choice from group
                }

                try {
                    await db.run(`
                        INSERT INTO sysreg (
                            value,
                            name,
                            description,
                            name_i18n,
                            desc_i18n,
                            taglogic,
                            is_default,
                            tagfamily
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (value, tagfamily) DO NOTHING
                    `, [
                        valueBytes,
                        tag.name,
                        tag.description || '',
                        tag.name_i18n ? JSON.stringify(tag.name_i18n) : '{}',
                        tag.desc_i18n ? JSON.stringify(tag.desc_i18n) : '{}',
                        taglogic,
                        false,
                        tagfamily
                    ])
                    tagInsertCount++
                    currentValue = currentValue << 1  // Next power of 2
                } catch (error) {
                    console.warn(`    ⚠️  Skipped tag: ${tag.name}`)
                }
            }

            console.log(`    ✓ Inserted ${tagInsertCount} tags into sysreg`)
        } else {
            console.log('    ℹ️  Tags table is empty, no data to migrate')
        }

        // ===================================================================
        // CHAPTER 4: Create Summary View
        // ===================================================================
        console.log('\n📖 Chapter 4: Create Summary View')

        // -------------------------------------------------------------------
        // 4.1: Create view for easy querying by tagfamily
        // -------------------------------------------------------------------
        console.log('\n  👁️  Creating sysreg_summary view...')

        await db.exec(`
            CREATE OR REPLACE VIEW sysreg_summary AS
            SELECT 
                tagfamily,
                COUNT(*) as entry_count,
                COUNT(CASE WHEN is_default THEN 1 END) as default_count,
                COUNT(CASE WHEN taglogic = 'category' THEN 1 END) as category_count,
                COUNT(CASE WHEN taglogic = 'subcategory' THEN 1 END) as subcategory_count,
                COUNT(CASE WHEN taglogic = 'option' THEN 1 END) as option_count,
                COUNT(CASE WHEN taglogic = 'toggle' THEN 1 END) as toggle_count
            FROM sysreg
            GROUP BY tagfamily
            ORDER BY tagfamily
        `)

        console.log('    ✓ Created sysreg_summary view')

        // -------------------------------------------------------------------
        // 4.2: Display migration summary
        // -------------------------------------------------------------------
        console.log('\n  📊 Migration Summary:')

        const summary = await db.all(`SELECT * FROM sysreg_summary`)
        for (const row of summary) {
            console.log(`    ${(row as any).tagfamily}: ${(row as any).entry_count} entries (${(row as any).default_count} defaults)`)
        }

        console.log('\n✅ Migration 022 completed: sysreg core table created with migrated data')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 022 rollback requires PostgreSQL.')
        }

        console.log('Rolling back migration 022: Removing sysreg table...')

        // Drop view
        await db.exec(`DROP VIEW IF EXISTS sysreg_summary`)
        console.log('  ✓ Dropped sysreg_summary view')

        // Drop functions
        await db.exec(`DROP FUNCTION IF EXISTS get_sysreg_desc(BYTEA, TEXT, TEXT)`)
        await db.exec(`DROP FUNCTION IF EXISTS get_sysreg_label(BYTEA, TEXT, TEXT)`)
        console.log('  ✓ Dropped lookup functions')

        // Drop indexes (cascade with table drop)
        // Drop table
        await db.exec(`DROP TABLE IF EXISTS sysreg CASCADE`)
        console.log('  ✓ Dropped sysreg table')

        console.log('✅ Migration 022 rolled back successfully')
        console.log('⚠️  Note: Original status and tags tables preserved (not modified by this migration)')
    }
}
