/**
 * Migration 023: Deprecate Old Status/Tags Tables
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Renames old status and tags tables to _depr suffix and removes FK constraints.
 * Prepares for transition to new sysreg system.
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 * 
 * Changes:
 * - Rename status → status_depr
 * - Rename tags → tags_depr  
 * - Rename junction tables: events_tags → events_tags_depr, posts_tags → posts_tags_depr
 * - Drop FK constraints from entity tables to old status table
 * - Rename status_id → status_id_depr on entity tables
 * - Drop status_display generated columns (will be recreated in migration 025)
 * - Rename tags_ids/tags_display → *_depr on events/posts
 * - Drop tag triggers
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '023_deprecate_old_tables',
    description: 'Deprecate old status/tags tables and FK constraints for transition to sysreg',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 023 requires PostgreSQL (table inheritance not supported in SQLite)')
        }

        console.log('Running migration 023: Deprecate old status/tags tables...')

        // ===================================================================
        // CHAPTER 1: Drop Dependent Objects
        // ===================================================================
        console.log('\n📖 Chapter 1: Drop Dependent Objects')

        // -------------------------------------------------------------------
        // 1.1: Drop tag triggers and functions
        // -------------------------------------------------------------------
        console.log('\n  🔧 Dropping tag triggers...')

        await db.exec(`
            DROP TRIGGER IF EXISTS trg_update_events_tags ON events_tags;
            DROP TRIGGER IF EXISTS trg_update_posts_tags ON posts_tags;
        `)

        await db.exec(`
            DROP FUNCTION IF EXISTS update_events_tags();
            DROP FUNCTION IF EXISTS update_posts_tags();
        `)

        console.log('    ✓ Dropped tag triggers and functions')

        // -------------------------------------------------------------------
        // 1.2: Drop status_display generated columns
        // -------------------------------------------------------------------
        console.log('\n  🗑️  Dropping status_display generated columns...')

        const entityTablesWithStatus = [
            'projects', 'events', 'posts', 'participants', 'instructors',
            'users', 'tasks', 'interactions'
        ]

        for (const table of entityTablesWithStatus) {
            await db.exec(`ALTER TABLE ${table} DROP COLUMN IF EXISTS status_display CASCADE`)
        }

        console.log(`    ✓ Dropped status_display from ${entityTablesWithStatus.length} tables`)

        // -------------------------------------------------------------------
        // 1.3: Drop get_status_display_name function
        // -------------------------------------------------------------------
        console.log('\n  🔧 Dropping old status display function...')

        await db.exec(`DROP FUNCTION IF EXISTS get_status_display_name(INTEGER, TEXT)`)

        console.log('    ✓ Dropped get_status_display_name function')

        // ===================================================================
        // CHAPTER 2: Deprecate Status Table and Constraints
        // ===================================================================
        console.log('\n📖 Chapter 2: Deprecate Status Table')

        // -------------------------------------------------------------------
        // 2.1: Drop FK constraints from entity tables
        // -------------------------------------------------------------------
        console.log('\n  🔓 Dropping FK constraints to status table...')

        // List of entity tables with status_id FK
        const constraintDrops = [
            { table: 'projects', constraint: 'projects_status_id_fkey' },
            { table: 'events', constraint: 'events_status_id_fkey' },
            { table: 'posts', constraint: 'posts_status_id_fkey' },
            { table: 'participants', constraint: 'participants_status_id_fkey' },
            { table: 'instructors', constraint: 'instructors_status_id_fkey' },
            { table: 'users', constraint: 'users_status_id_fkey' },
            { table: 'tasks', constraint: 'tasks_status_id_fkey' },
            { table: 'interactions', constraint: 'interactions_status_id_fkey' },
            { table: 'images', constraint: 'images_status_id_fkey' }
        ]

        let droppedConstraints = 0
        for (const { table, constraint } of constraintDrops) {
            try {
                await db.exec(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${constraint}`)
                droppedConstraints++
            } catch (error) {
                console.warn(`    ⚠️  Could not drop constraint ${constraint} (may not exist)`)
            }
        }

        console.log(`    ✓ Dropped ${droppedConstraints} FK constraints`)

        // -------------------------------------------------------------------
        // 2.2: Rename status_id columns to status_id_depr
        // -------------------------------------------------------------------
        console.log('\n  📝 Renaming status_id columns...')

        const tablesWithStatusId = [
            'projects', 'events', 'posts', 'participants', 'instructors',
            'users', 'tasks', 'interactions', 'images'
        ]

        for (const table of tablesWithStatusId) {
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN status_id TO status_id_depr`)
        }

        console.log(`    ✓ Renamed status_id → status_id_depr on ${tablesWithStatusId.length} tables`)

        // -------------------------------------------------------------------
        // 2.3: Rename status table
        // -------------------------------------------------------------------
        console.log('\n  📦 Renaming status table...')

        await db.exec(`ALTER TABLE status RENAME TO status_depr`)

        console.log('    ✓ Renamed status → status_depr')

        // ===================================================================
        // CHAPTER 3: Deprecate Tags Tables
        // ===================================================================
        console.log('\n📖 Chapter 3: Deprecate Tags Tables')

        // -------------------------------------------------------------------
        // 3.1: Rename tags_ids and tags_display columns
        // -------------------------------------------------------------------
        console.log('\n  📝 Renaming tags columns on events/posts...')

        await db.exec(`
            ALTER TABLE events RENAME COLUMN tags_ids TO tags_ids_depr;
            ALTER TABLE events RENAME COLUMN tags_display TO tags_display_depr;
        `)

        await db.exec(`
            ALTER TABLE posts RENAME COLUMN tags_ids TO tags_ids_depr;
            ALTER TABLE posts RENAME COLUMN tags_display TO tags_display_depr;
        `)

        console.log('    ✓ Renamed tags_ids/tags_display → *_depr on events/posts')

        // -------------------------------------------------------------------
        // 3.2: Rename junction tables
        // -------------------------------------------------------------------
        console.log('\n  📦 Renaming junction tables...')

        await db.exec(`ALTER TABLE events_tags RENAME TO events_tags_depr`)
        await db.exec(`ALTER TABLE posts_tags RENAME TO posts_tags_depr`)

        console.log('    ✓ Renamed events_tags/posts_tags → *_depr')

        // -------------------------------------------------------------------
        // 3.3: Rename tags table
        // -------------------------------------------------------------------
        console.log('\n  📦 Renaming tags table...')

        await db.exec(`ALTER TABLE tags RENAME TO tags_depr`)

        console.log('    ✓ Renamed tags → tags_depr')

        // ===================================================================
        // CHAPTER 4: Summary
        // ===================================================================
        console.log('\n📊 Migration Summary:')
        console.log(`  Tables renamed: status_depr, tags_depr, events_tags_depr, posts_tags_depr`)
        console.log(`  Constraints dropped: ${droppedConstraints} FK constraints`)
        console.log(`  Columns renamed: status_id_depr on ${tablesWithStatusId.length} tables`)
        console.log(`  Columns dropped: status_display on ${entityTablesWithStatus.length} tables`)
        console.log(`  Functions dropped: get_status_display_name, update_events_tags, update_posts_tags`)
        console.log(`  Triggers dropped: events_tags_trigger, posts_tags_trigger`)

        console.log('\n✅ Migration 023 completed: Old tables deprecated, ready for sysreg transition')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 023: Restoring old status/tags tables...')

        // Restore tables
        await db.exec(`ALTER TABLE status_depr RENAME TO status`)
        await db.exec(`ALTER TABLE tags_depr RENAME TO tags`)
        await db.exec(`ALTER TABLE events_tags_depr RENAME TO events_tags`)
        await db.exec(`ALTER TABLE posts_tags_depr RENAME TO posts_tags`)

        // Restore status_id columns
        const tables = ['projects', 'events', 'posts', 'participants', 'instructors', 'users', 'tasks', 'interactions', 'images']
        for (const table of tables) {
            await db.exec(`ALTER TABLE ${table} RENAME COLUMN status_id_depr TO status_id`)
        }

        // Restore tags columns
        await db.exec(`
            ALTER TABLE events RENAME COLUMN tags_ids_depr TO tags_ids;
            ALTER TABLE events RENAME COLUMN tags_display_depr TO tags_display;
            ALTER TABLE posts RENAME COLUMN tags_ids_depr TO tags_ids;
            ALTER TABLE posts RENAME COLUMN tags_display_depr TO tags_display;
        `)

        // Restore FK constraints
        for (const table of tables) {
            await db.exec(`
                ALTER TABLE ${table} 
                ADD CONSTRAINT ${table}_status_id_fkey 
                FOREIGN KEY (status_id) REFERENCES status(id)
            `)
        }

        // Restore functions and triggers from migration 019/020
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

                SELECT name_i18n, name INTO v_name_i18n, v_name
                FROM status
                WHERE id = p_status_id;

                RETURN COALESCE(
                    v_name_i18n->>p_lang,
                    v_name_i18n->>'de',
                    v_name_i18n->>'en',
                    v_name
                );
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `)

        // Restore status_display generated columns
        const tablesWithLang = ['users', 'tasks', 'participants', 'instructors', 'locations']
        for (const table of tablesWithLang) {
            await db.exec(`
                ALTER TABLE ${table}
                ADD COLUMN status_display TEXT
                GENERATED ALWAYS AS (
                    get_status_display_name(status_id, lang)
                ) STORED
            `)
        }

        const tablesWithoutLang = ['projects', 'events', 'posts', 'interactions']
        for (const table of tablesWithoutLang) {
            await db.exec(`
                ALTER TABLE ${table}
                ADD COLUMN status_display TEXT
                GENERATED ALWAYS AS (
                    get_status_display_name(status_id, 'de')
                ) STORED
            `)
        }

        // Restore tag triggers
        await db.exec(`
            CREATE OR REPLACE FUNCTION update_events_tags()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE events e
                SET 
                    tags_ids = COALESCE((
                        SELECT ARRAY_AGG(tag_id ORDER BY tag_id)
                        FROM events_tags
                        WHERE event_id = e.id
                    ), '{}'),
                    tags_display = COALESCE((
                        SELECT ARRAY_AGG(
                            COALESCE(
                                t.name_i18n->>e.lang,
                                t.name
                            ) ORDER BY t.name
                        )
                        FROM events_tags et
                        JOIN tags t ON et.tag_id = t.id
                        WHERE et.event_id = e.id
                    ), '{}')
                WHERE e.id = COALESCE(NEW.event_id, OLD.event_id);
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER events_tags_trigger
                AFTER INSERT OR UPDATE OR DELETE ON events_tags
                FOR EACH ROW
                EXECUTE FUNCTION update_events_tags();
        `)

        await db.exec(`
            CREATE OR REPLACE FUNCTION update_posts_tags()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE posts p
                SET 
                    tags_ids = COALESCE((
                        SELECT ARRAY_AGG(tag_id ORDER BY tag_id)
                        FROM posts_tags
                        WHERE post_id = p.id
                    ), '{}'),
                    tags_display = COALESCE((
                        SELECT ARRAY_AGG(
                            COALESCE(
                                t.name_i18n->>p.lang,
                                t.name
                            ) ORDER BY t.name
                        )
                        FROM posts_tags pt
                        JOIN tags t ON pt.tag_id = t.id
                        WHERE pt.post_id = p.id
                    ), '{}')
                WHERE p.id = COALESCE(NEW.post_id, OLD.post_id);
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER posts_tags_trigger
                AFTER INSERT OR UPDATE OR DELETE ON posts_tags
                FOR EACH ROW
                EXECUTE FUNCTION update_posts_tags();
        `)

        console.log('✅ Migration 023 rollback completed')
    }
}
