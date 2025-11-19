/**
 * Migration 025: Align Entity Tables with sysreg System
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Adds new *_val BYTEA columns to entity tables for sysreg values.
 * Creates generated columns for i18n-aware label/description lookups.
 * No FK constraints - uses value-based lookups for performance.
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 * 
 * Full entities (all 6 tagfamilies):
 * - projects, events, posts, participants, instructors, images
 * 
 * Partial entities (status, rtags, config only):
 * - users, tasks, interactions
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '025_align_entity_tables',
    description: 'Add sysreg *_val columns and generated columns to entity tables',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 025 requires PostgreSQL')
        }

        console.log('Running migration 025: Align entity tables with sysreg system...')

        // ===================================================================
        // CHAPTER 1: Add BYTEA Columns to Full Entities
        // ===================================================================
        console.log('\n📖 Chapter 1: Add BYTEA Columns to Full Entities')

        const fullEntities = ['projects', 'events', 'posts', 'participants', 'instructors', 'images']

        for (const table of fullEntities) {
            console.log(`\n  📦 Processing ${table}...`)

            await db.exec(`
                ALTER TABLE ${table}
                ADD COLUMN IF NOT EXISTS status_val BYTEA DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS config_val BYTEA DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS rtags_val BYTEA DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS ctags_val BYTEA DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS ttags_val BYTEA DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS dtags_val BYTEA DEFAULT NULL;
            `)

            console.log(`    ✓ Added 6 *_val columns to ${table}`)
        }

        // ===================================================================
        // CHAPTER 2: Add BYTEA Columns to Partial Entities
        // ===================================================================
        console.log('\n📖 Chapter 2: Add BYTEA Columns to Partial Entities')

        const partialEntities = ['users', 'tasks', 'interactions']

        for (const table of partialEntities) {
            console.log(`\n  📦 Processing ${table}...`)

            await db.exec(`
                ALTER TABLE ${table}
                ADD COLUMN IF NOT EXISTS status_val BYTEA DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS config_val BYTEA DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS rtags_val BYTEA DEFAULT NULL;
            `)

            console.log(`    ✓ Added 3 *_val columns to ${table}`)
        }

        // ===================================================================
        // CHAPTER 3: Add lang Column Where Missing
        // ===================================================================
        console.log('\n📖 Chapter 3: Ensure lang Column Exists')

        // Check which tables need lang column
        const allEntities = [...fullEntities, ...partialEntities]

        for (const table of allEntities) {
            // Check if lang column exists
            const result = await db.get(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = 'lang'
            `, [table])

            if (!result) {
                console.log(`\n  📝 Adding lang column to ${table}...`)
                await db.exec(`
                    ALTER TABLE ${table}
                    ADD COLUMN lang TEXT DEFAULT 'en' CHECK (lang IN ('de', 'en', 'cz'));
                `)
                console.log(`    ✓ Added lang column to ${table}`)
            }
        }

        // ===================================================================
        // CHAPTER 4: Create Generated Columns for Status
        // ===================================================================
        console.log('\n📖 Chapter 4: Create Status Generated Columns')

        for (const table of allEntities) {
            console.log(`\n  🔧 Adding status_label to ${table}...`)

            await db.exec(`
                ALTER TABLE ${table}
                ADD COLUMN IF NOT EXISTS status_label TEXT
                    GENERATED ALWAYS AS (
                        get_sysreg_label(status_val, 'status', lang)
                    ) STORED;
            `)

            console.log(`    ✓ Added status_label to ${table}`)
        }

        // ===================================================================
        // CHAPTER 5: Create Indexes on New Columns
        // ===================================================================
        console.log('\n📖 Chapter 5: Create Indexes on *_val Columns')

        for (const table of fullEntities) {
            console.log(`\n  📇 Creating indexes on ${table}...`)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_${table}_status_val ON ${table} USING hash(status_val);
                CREATE INDEX IF NOT EXISTS idx_${table}_config_val ON ${table} USING hash(config_val);
                CREATE INDEX IF NOT EXISTS idx_${table}_ctags_val ON ${table} USING hash(ctags_val);
            `)

            console.log(`    ✓ Created indexes on ${table}`)
        }

        for (const table of partialEntities) {
            console.log(`\n  📇 Creating indexes on ${table}...`)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_${table}_status_val ON ${table} USING hash(status_val);
                CREATE INDEX IF NOT EXISTS idx_${table}_config_val ON ${table} USING hash(config_val);
            `)

            console.log(`    ✓ Created indexes on ${table}`)
        }

        // ===================================================================
        // CHAPTER 6: Create Helper Views
        // ===================================================================
        console.log('\n📖 Chapter 6: Create Helper Views')

        // Create view showing entity tables with their sysreg columns
        await db.exec(`
            CREATE OR REPLACE VIEW v_entity_sysreg_columns AS
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
                      AND c.column_name = 'status_val'
                ) as status_val_exists,
                EXISTS(
                    SELECT 1 FROM information_schema.columns c
                    WHERE c.table_name = t.table_name 
                      AND c.column_name = 'status_label'
                ) as status_label_exists
            FROM alltables t
            WHERE t.is_entity = true
            ORDER BY t.table_name;

            COMMENT ON VIEW v_entity_sysreg_columns IS 'Entity tables with their sysreg column status';
        `)

        console.log('    ✓ Created v_entity_sysreg_columns view')

        // ===================================================================
        // CHAPTER 7: Summary
        // ===================================================================
        console.log('\n📊 Migration Summary:')
        console.log('  Full entities (6 tagfamilies):')
        console.log(`    ${fullEntities.join(', ')}`)
        console.log('  Partial entities (3 tagfamilies):')
        console.log(`    ${partialEntities.join(', ')}`)
        console.log('\n  Columns added per table:')
        console.log('    Full: status_val, config_val, rtags_val, ctags_val, ttags_val, dtags_val')
        console.log('    Partial: status_val, config_val, rtags_val')
        console.log('    All: status_label (generated via get_sysreg_label)')
        console.log('\n  Strategy: NO FK constraints (value-based lookup)')
        console.log('  Performance: Hash indexes on *_val columns')
        console.log('  i18n: Generated columns use lang field for translations')

        console.log('\n✅ Migration 025 completed: Entity tables aligned with sysreg system')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 025: Removing sysreg columns from entity tables...')

        const fullEntities = ['projects', 'events', 'posts', 'participants', 'instructors', 'images']
        const partialEntities = ['users', 'tasks', 'interactions']
        const allEntities = [...fullEntities, ...partialEntities]

        // Drop view
        await db.exec(`DROP VIEW IF EXISTS v_entity_sysreg_columns CASCADE`)

        // Drop columns from all entities
        for (const table of allEntities) {
            console.log(`  Removing columns from ${table}...`)

            await db.exec(`
                ALTER TABLE ${table}
                DROP COLUMN IF EXISTS status_label CASCADE,
                DROP COLUMN IF EXISTS status_val CASCADE,
                DROP COLUMN IF EXISTS config_val CASCADE,
                DROP COLUMN IF EXISTS rtags_val CASCADE;
            `)
        }

        // Drop additional columns from full entities
        for (const table of fullEntities) {
            await db.exec(`
                ALTER TABLE ${table}
                DROP COLUMN IF EXISTS ctags_val CASCADE,
                DROP COLUMN IF EXISTS ttags_val CASCADE,
                DROP COLUMN IF EXISTS dtags_val CASCADE;
            `)
        }

        console.log('✅ Migration 025 rollback completed')
    }
}
