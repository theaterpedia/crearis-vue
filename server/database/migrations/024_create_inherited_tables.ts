/**
 * Migration 024: Create Inherited Tables from sysreg
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Creates 6 child tables that inherit from sysreg using PostgreSQL table inheritance.
 * Also creates alltables and entities metadata registries.
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 * 
 * Creates:
 * - sysreg_status (inherits sysreg, tagfamily='status')
 * - sysreg_config (inherits sysreg, tagfamily='config')
 * - sysreg_rtags (inherits sysreg, tagfamily='rtags')
 * - sysreg_ctags (inherits sysreg, tagfamily='ctags')
 * - sysreg_ttags (inherits sysreg, tagfamily='ttags')
 * - sysreg_dtags (inherits sysreg, tagfamily='dtags')
 * - alltables (metadata registry for all database tables)
 * - entities (metadata registry for entity tables)
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '024_create_inherited_tables',
    description: 'Create 6 inherited tables from sysreg and metadata registries',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 024 requires PostgreSQL (table inheritance not supported in SQLite)')
        }

        console.log('Running migration 024: Create inherited tables from sysreg...')

        // ===================================================================
        // CHAPTER 1: Create Inherited Tables (6 tagfamilies)
        // ===================================================================
        console.log('\n📖 Chapter 1: Create Inherited Tables')

        // -------------------------------------------------------------------
        // 1.1: Create sysreg_status (tagfamily='status')
        // -------------------------------------------------------------------
        console.log('\n  📦 Creating sysreg_status...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sysreg_status (
                CHECK (tagfamily = 'status')
            ) INHERITS (sysreg);

            -- Create index on value for fast lookups (inherited id column has index from parent)
            CREATE INDEX IF NOT EXISTS idx_sysreg_status_value ON sysreg_status(value);
            
            -- Add comment
            COMMENT ON TABLE sysreg_status IS 'Status values for entity lifecycle states (inherits from sysreg)';
        `)

        console.log('    ✓ Created sysreg_status')

        // -------------------------------------------------------------------
        // 1.2: Create sysreg_config (tagfamily='config')
        // -------------------------------------------------------------------
        console.log('\n  📦 Creating sysreg_config...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sysreg_config (
                CHECK (tagfamily = 'config')
            ) INHERITS (sysreg);

            CREATE INDEX IF NOT EXISTS idx_sysreg_config_value ON sysreg_config(value);
            
            COMMENT ON TABLE sysreg_config IS 'Configuration flags and settings (inherits from sysreg)';
        `)

        console.log('    ✓ Created sysreg_config')

        // -------------------------------------------------------------------
        // 1.3: Create sysreg_rtags (tagfamily='rtags')
        // -------------------------------------------------------------------
        console.log('\n  📦 Creating sysreg_rtags...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sysreg_rtags (
                CHECK (tagfamily = 'rtags')
            ) INHERITS (sysreg);

            CREATE INDEX IF NOT EXISTS idx_sysreg_rtags_value ON sysreg_rtags(value);
            
            COMMENT ON TABLE sysreg_rtags IS 'Record-specific tags (inherits from sysreg)';
        `)

        console.log('    ✓ Created sysreg_rtags')

        // -------------------------------------------------------------------
        // 1.4: Create sysreg_ctags (tagfamily='ctags')
        // -------------------------------------------------------------------
        console.log('\n  📦 Creating sysreg_ctags...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sysreg_ctags (
                CHECK (tagfamily = 'ctags')
            ) INHERITS (sysreg);

            CREATE INDEX IF NOT EXISTS idx_sysreg_ctags_value ON sysreg_ctags(value);
            
            COMMENT ON TABLE sysreg_ctags IS 'Common tags like age groups, accessibility (inherits from sysreg)';
        `)

        console.log('    ✓ Created sysreg_ctags')

        // -------------------------------------------------------------------
        // 1.5: Create sysreg_ttags (tagfamily='ttags')
        // -------------------------------------------------------------------
        console.log('\n  📦 Creating sysreg_ttags...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sysreg_ttags (
                CHECK (tagfamily = 'ttags')
            ) INHERITS (sysreg);

            CREATE INDEX IF NOT EXISTS idx_sysreg_ttags_value ON sysreg_ttags(value);
            
            COMMENT ON TABLE sysreg_ttags IS 'Topic tags like democracy, environment (inherits from sysreg)';
        `)

        console.log('    ✓ Created sysreg_ttags')

        // -------------------------------------------------------------------
        // 1.6: Create sysreg_dtags (tagfamily='dtags')
        // -------------------------------------------------------------------
        console.log('\n  📦 Creating sysreg_dtags...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sysreg_dtags (
                CHECK (tagfamily = 'dtags')
            ) INHERITS (sysreg);

            CREATE INDEX IF NOT EXISTS idx_sysreg_dtags_value ON sysreg_dtags(value);
            
            COMMENT ON TABLE sysreg_dtags IS 'Domain tags like games, education (inherits from sysreg)';
        `)

        console.log('    ✓ Created sysreg_dtags')

        // ===================================================================
        // CHAPTER 2: Create Views for Convenient Querying
        // ===================================================================
        console.log('\n📖 Chapter 2: Create Convenience Views')

        // -------------------------------------------------------------------
        // 2.1: Create view for easy status lookups
        // -------------------------------------------------------------------
        console.log('\n  👁️  Creating status lookup views...')

        await db.exec(`
            CREATE OR REPLACE VIEW v_status AS
            SELECT 
                encode(value, 'hex') as hex_value,
                value,
                name,
                description,
                taglogic,
                is_default,
                name_i18n,
                desc_i18n
            FROM sysreg_status
            ORDER BY value;

            COMMENT ON VIEW v_status IS 'Human-readable view of status values with hex encoding';
        `)

        console.log('    ✓ Created v_status view')

        // -------------------------------------------------------------------
        // 2.2: Create view for tags overview
        // -------------------------------------------------------------------
        console.log('\n  👁️  Creating tags overview view...')

        await db.exec(`
            CREATE OR REPLACE VIEW v_all_tags AS
            SELECT 
                encode(value, 'hex') as hex_value,
                value,
                tagfamily,
                name,
                taglogic,
                name_i18n
            FROM sysreg
            WHERE tagfamily IN ('rtags', 'ctags', 'ttags', 'dtags')
            ORDER BY tagfamily, value;

            COMMENT ON VIEW v_all_tags IS 'Overview of all tag types (rtags, ctags, ttags, dtags)';
        `)

        console.log('    ✓ Created v_all_tags view')

        // ===================================================================
        // CHAPTER 3: Create Metadata Registries
        // ===================================================================
        console.log('\n📖 Chapter 3: Create Metadata Registries')

        // -------------------------------------------------------------------
        // 3.1: Create alltables registry
        // -------------------------------------------------------------------
        console.log('\n  📋 Creating alltables registry...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS alltables (
                table_name TEXT PRIMARY KEY,
                is_entity BOOLEAN DEFAULT FALSE,
                has_status BOOLEAN DEFAULT FALSE,
                has_config BOOLEAN DEFAULT FALSE,
                has_rtags BOOLEAN DEFAULT FALSE,
                has_ctags BOOLEAN DEFAULT FALSE,
                has_ttags BOOLEAN DEFAULT FALSE,
                has_dtags BOOLEAN DEFAULT FALSE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_alltables_is_entity ON alltables(is_entity);

            COMMENT ON TABLE alltables IS 'Registry of all database tables and their sysreg support';
        `)

        console.log('    ✓ Created alltables registry')

        // -------------------------------------------------------------------
        // 3.2: Seed alltables with entity tables
        // -------------------------------------------------------------------
        console.log('\n  🌱 Seeding alltables with entity tables...')

        // Full entities: projects, events, posts, participants, instructors, images
        // Partial entities: users, tasks, interactions
        await db.exec(`
            INSERT INTO alltables (table_name, is_entity, has_status, has_config, has_rtags, has_ctags, has_ttags, has_dtags, description)
            VALUES
                ('projects', true, true, true, true, true, true, true, 'Full entity: Project records'),
                ('events', true, true, true, true, true, true, true, 'Full entity: Event records'),
                ('posts', true, true, true, true, true, true, true, 'Full entity: Post/article records'),
                ('participants', true, true, true, true, true, true, true, 'Full entity: Participant records'),
                ('instructors', true, true, true, true, true, true, true, 'Full entity: Instructor records'),
                ('images', true, true, true, true, true, true, true, 'Full entity: Image records'),
                ('users', true, true, true, true, false, false, false, 'Partial entity: User accounts (status, config, rtags only)'),
                ('tasks', true, true, true, true, false, false, false, 'Partial entity: Task records (status, config, rtags only)'),
                ('interactions', true, true, true, true, false, false, false, 'Partial entity: Interaction records (status, config, rtags only)')
            ON CONFLICT (table_name) DO UPDATE SET
                is_entity = EXCLUDED.is_entity,
                has_status = EXCLUDED.has_status,
                has_config = EXCLUDED.has_config,
                has_rtags = EXCLUDED.has_rtags,
                has_ctags = EXCLUDED.has_ctags,
                has_ttags = EXCLUDED.has_ttags,
                has_dtags = EXCLUDED.has_dtags,
                description = EXCLUDED.description,
                updated_at = CURRENT_TIMESTAMP;
        `)

        console.log('    ✓ Seeded 9 entity tables in alltables')

        // -------------------------------------------------------------------
        // 3.3: Create entities view
        // -------------------------------------------------------------------
        console.log('\n  👁️  Creating entities view...')

        await db.exec(`
            CREATE OR REPLACE VIEW entities AS
            SELECT * FROM alltables WHERE is_entity = true;

            COMMENT ON VIEW entities IS 'All entity tables (is_entity=true)';
        `)

        console.log('    ✓ Created entities view')

        // ===================================================================
        // CHAPTER 4: Create Helper Functions
        // ===================================================================
        console.log('\n📖 Chapter 4: Create Helper Functions')

        // -------------------------------------------------------------------
        // 4.1: Create function to get tagfamily counts
        // -------------------------------------------------------------------
        console.log('\n  🔧 Creating tagfamily count function...')

        await db.exec(`
            CREATE OR REPLACE FUNCTION get_tagfamily_counts()
            RETURNS TABLE(
                tagfamily TEXT,
                total_count BIGINT,
                default_count BIGINT
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    s.tagfamily,
                    COUNT(*) as total_count,
                    COUNT(*) FILTER (WHERE s.is_default) as default_count
                FROM sysreg s
                GROUP BY s.tagfamily
                ORDER BY s.tagfamily;
            END;
            $$ LANGUAGE plpgsql STABLE;

            COMMENT ON FUNCTION get_tagfamily_counts() IS 'Get counts of entries per tagfamily with defaults';
        `)

        console.log('    ✓ Created get_tagfamily_counts()')

        // -------------------------------------------------------------------
        // 4.2: Create function to validate BYTEA values exist
        // -------------------------------------------------------------------
        console.log('\n  🔧 Creating value validation function...')

        await db.exec(`
            CREATE OR REPLACE FUNCTION validate_sysreg_value(
                p_value BYTEA,
                p_tagfamily TEXT
            ) RETURNS BOOLEAN AS $$
            BEGIN
                RETURN EXISTS(
                    SELECT 1 FROM sysreg
                    WHERE value = p_value
                      AND tagfamily = p_tagfamily
                );
            END;
            $$ LANGUAGE plpgsql STABLE;

            COMMENT ON FUNCTION validate_sysreg_value(BYTEA, TEXT) IS 'Check if a BYTEA value exists in sysreg for given tagfamily';
        `)

        console.log('    ✓ Created validate_sysreg_value()')

        // ===================================================================
        // CHAPTER 5: Summary
        // ===================================================================
        console.log('\n📊 Migration Summary:')

        const counts = await db.all(`
            SELECT tagfamily, COUNT(*) as count
            FROM sysreg
            GROUP BY tagfamily
            ORDER BY tagfamily
        `, [])

        console.log('  Inherited tables created:')
        console.log('    • sysreg_status (status records)')
        console.log('    • sysreg_config (config flags)')
        console.log('    • sysreg_rtags (record tags)')
        console.log('    • sysreg_ctags (common tags)')
        console.log('    • sysreg_ttags (topic tags)')
        console.log('    • sysreg_dtags (domain tags)')
        console.log('\n  Data distribution:')
        for (const row of counts) {
            console.log(`    ${(row as any).tagfamily}: ${(row as any).count} entries`)
        }
        console.log('\n  Metadata registries:')
        console.log('    • alltables: 9 entity tables registered')
        console.log('    • entities view: Full + Partial entities')
        console.log('\n  Helper functions:')
        console.log('    • get_tagfamily_counts()')
        console.log('    • validate_sysreg_value(value, tagfamily)')
        console.log('\n  Views created:')
        console.log('    • v_status (human-readable status with hex)')
        console.log('    • v_all_tags (all tag types overview)')

        console.log('\n✅ Migration 024 completed: Inherited tables and registries created')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 024: Dropping inherited tables and registries...')

        // Drop views
        await db.exec(`
            DROP VIEW IF EXISTS entities CASCADE;
            DROP VIEW IF EXISTS v_all_tags CASCADE;
            DROP VIEW IF EXISTS v_status CASCADE;
        `)

        // Drop functions
        await db.exec(`
            DROP FUNCTION IF EXISTS validate_sysreg_value(BYTEA, TEXT);
            DROP FUNCTION IF EXISTS get_tagfamily_counts();
        `)

        // Drop registries
        await db.exec(`DROP TABLE IF EXISTS alltables CASCADE`)

        // Drop inherited tables
        await db.exec(`
            DROP TABLE IF EXISTS sysreg_dtags CASCADE;
            DROP TABLE IF EXISTS sysreg_ttags CASCADE;
            DROP TABLE IF EXISTS sysreg_ctags CASCADE;
            DROP TABLE IF EXISTS sysreg_rtags CASCADE;
            DROP TABLE IF EXISTS sysreg_config CASCADE;
            DROP TABLE IF EXISTS sysreg_status CASCADE;
        `)

        console.log('✅ Migration 024 rollback completed')
    }
}
