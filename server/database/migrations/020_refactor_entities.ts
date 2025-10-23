/**
 * Migration 020: Add i18n Core
 * 
 * Chapter 1: Add Language Support
 * - Add 'lang' field to participants, instructors, tasks, locations, users
 * - Add 'status_display' computed column for translated status names
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '020_refactor_entities',
    description: 'Add i18n core: lang field and status_display computed column',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 020: Add i18n core...')

        // ===================================================================
        // CHAPTER 1: Add Language Support and Status Display
        // ===================================================================
        console.log('\n📖 Chapter 1: Add i18n Core')

        // -------------------------------------------------------------------
        // 1.1: Add 'lang' field to tables
        // -------------------------------------------------------------------
        console.log('\n  🌐 Adding lang field to tables...')

        const tables = ['participants', 'instructors', 'tasks', 'locations', 'users']

        for (const table of tables) {
            if (isPostgres) {
                await db.exec(`
                    ALTER TABLE ${table} 
                    ADD COLUMN IF NOT EXISTS lang TEXT 
                    NOT NULL DEFAULT 'de' 
                    CHECK (lang IN ('de', 'en', 'cz'))
                `)
            } else {
                // SQLite
                await db.exec(`
                    ALTER TABLE ${table} 
                    ADD COLUMN lang TEXT NOT NULL DEFAULT 'de' 
                    CHECK (lang IN ('de', 'en', 'cz'))
                `)
            }
            console.log(`    ✓ Added lang field to ${table}`)
        }

        // -------------------------------------------------------------------
        // 1.2: Add 'status_display' computed column
        // -------------------------------------------------------------------
        console.log('\n  📊 Adding status_display computed column...')

        // All tables use status_id column (consistent naming)
        const tablesWithStatusId = [
            'events',
            'posts',
            'participants',
            'instructors',
            'tasks',
            'locations',
            'users'
        ]

        if (isPostgres) {
            // PostgreSQL: Create function to get translated status name
            console.log('    → Creating status_display_name function...')
            await db.exec(`
                CREATE OR REPLACE FUNCTION get_status_display_name(
                    p_status_id INTEGER,
                    p_lang TEXT
                ) RETURNS TEXT AS $$
                DECLARE
                    v_name_i18n JSONB;
                    v_name TEXT;
                BEGIN
                    IF p_status_id IS NULL THEN
                        RETURN NULL;
                    END IF;

                    -- Get name_i18n from status table
                    SELECT name_i18n, name INTO v_name_i18n, v_name
                    FROM status
                    WHERE id = p_status_id;

                    -- If name_i18n is null or doesn't contain the language, return name
                    IF v_name_i18n IS NULL THEN
                        RETURN v_name;
                    END IF;

                    -- Try to get translated name, fallback to 'de', then 'en', then base name
                    RETURN COALESCE(
                        v_name_i18n->>p_lang,
                        v_name_i18n->>'de',
                        v_name_i18n->>'en',
                        v_name
                    );
                END;
                $$ LANGUAGE plpgsql IMMUTABLE;
            `)

            // Add computed columns for all tables
            for (const table of tablesWithStatusId) {
                // Check if table has 'lang' column (for determining which lang to use)
                const hasLang = tables.includes(table)

                if (hasLang) {
                    // Use table's own lang field
                    await db.exec(`
                        ALTER TABLE ${table}
                        ADD COLUMN IF NOT EXISTS status_display TEXT
                        GENERATED ALWAYS AS (
                            get_status_display_name(status_id, lang)
                        ) STORED
                    `)
                } else {
                    // Use default 'de' for tables without lang field
                    await db.exec(`
                        ALTER TABLE ${table}
                        ADD COLUMN IF NOT EXISTS status_display TEXT
                        GENERATED ALWAYS AS (
                            get_status_display_name(status_id, 'de')
                        ) STORED
                    `)
                }
                console.log(`    ✓ Added status_display to ${table}`)
            }

        } else {
            // SQLite: Computed columns not supported in older versions
            // We'll need to handle this in application layer or use views
            console.log('    ⚠️  SQLite: status_display should be computed in application layer')
            console.log('    ℹ️  Use: status.name_i18n[lang] in queries')
        }

        console.log('\n✅ Chapter 1 completed: i18n core added (lang + status_display)')
        console.log('✅ Migration 020 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Migration 020 down: Removing i18n core...')

        const tables = ['participants', 'instructors', 'tasks', 'locations', 'users']
        const tablesWithStatus = ['events', 'posts', 'participants', 'instructors', 'tasks', 'locations', 'users']

        // Drop status_display columns
        for (const table of tablesWithStatus) {
            await db.exec(`ALTER TABLE ${table} DROP COLUMN IF EXISTS status_display`)
        }

        // Drop function (PostgreSQL only)
        if (isPostgres) {
            await db.exec(`DROP FUNCTION IF EXISTS get_status_display_name(INTEGER, TEXT)`)
        }

        // Drop lang columns
        for (const table of tables) {
            await db.exec(`ALTER TABLE ${table} DROP COLUMN IF EXISTS lang`)
        }

        console.log('✅ Migration 020 reverted')
    }
}

export default migration
