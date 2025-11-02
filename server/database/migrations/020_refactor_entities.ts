/**
 * Migration 020: Add i18n Core
 * 
 * IMPORTANT: Support for SQLite is completely dropped from migration 019 onwards.
 * Reason: Implementation follows PostgreSQL-specific syntax (custom types, computed columns, etc.)
 * 
 * Chapter 1: Add Language Support
 * - Add 'lang' field to participants, instructors, tasks, locations, users
 * - Add 'status_display' computed column for translated status names
 * 
 * Chapter 2: Create i18n_codes Table
 * - Create i18n_codes table for managing multi-language translations
 * - Seed initial translation entries (button, field types)
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

        // ===================================================================
        // CHAPTER 2: Create i18n_codes Table
        // ===================================================================
        console.log('\n📖 Chapter 2: Create i18n_codes Table')

        // -------------------------------------------------------------------
        // 2.1: Create i18n_codes table
        // -------------------------------------------------------------------
        console.log('\n  🌍 Creating i18n_codes table...')

        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS i18n_codes (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    variation TEXT DEFAULT 'false',
                    type TEXT NOT NULL CHECK (type IN ('button', 'nav', 'field', 'desc')),
                    text JSONB NOT NULL,
                    status TEXT NOT NULL DEFAULT 'de' CHECK (status IN ('de', 'en', 'cz', 'draft', 'ok')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)

            // Create indexes for common query patterns
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_i18n_codes_name 
                ON i18n_codes(name)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_i18n_codes_type 
                ON i18n_codes(type)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_i18n_codes_status 
                ON i18n_codes(status)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_i18n_codes_name_variation 
                ON i18n_codes(name, variation)
            `)

            // Create unique index to prevent duplicate name+variation+type combinations
            await db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_i18n_codes_unique 
                ON i18n_codes(name, variation, type)
            `)

            console.log('    ✓ Created i18n_codes table with indexes (PostgreSQL)')
        } else {
            // SQLite
            await db.exec(`
                CREATE TABLE IF NOT EXISTS i18n_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    variation TEXT DEFAULT 'false',
                    type TEXT NOT NULL CHECK (type IN ('button', 'nav', 'field', 'desc')),
                    text TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'de' CHECK (status IN ('de', 'en', 'cz', 'draft', 'ok')),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_i18n_codes_name 
                ON i18n_codes(name)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_i18n_codes_type 
                ON i18n_codes(type)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_i18n_codes_status 
                ON i18n_codes(status)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_i18n_codes_name_variation 
                ON i18n_codes(name, variation)
            `)

            await db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_i18n_codes_unique 
                ON i18n_codes(name, variation, type)
            `)

            console.log('    ✓ Created i18n_codes table with indexes (SQLite)')
        }

        // -------------------------------------------------------------------
        // 2.2: Seed initial i18n entries
        // -------------------------------------------------------------------
        console.log('\n  📝 Seeding initial i18n entries...')

        if (isPostgres) {
            // Entry 1: "ok" button - same in all languages
            await db.exec(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (
                    'ok',
                    'false',
                    'button',
                    '{"de": "ok", "en": "ok", "cz": "ok"}'::jsonb,
                    'ok'
                )
            `)
            console.log('    ✓ Seeded: ok button (all languages same)')

            // Entry 2: "abbrechen" button - different translations
            await db.exec(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (
                    'abbrechen',
                    'false',
                    'button',
                    '{"de": "abbrechen", "en": "cancel", "cz": "zrusit"}'::jsonb,
                    'ok'
                )
            `)
            console.log('    ✓ Seeded: abbrechen button (de/en/cz)')

            // Entry 3: "name" field - generic
            await db.exec(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (
                    'name',
                    'false',
                    'field',
                    '{"de": "Titel", "en": "Heading", "cz": "titul"}'::jsonb,
                    'ok'
                )
            `)
            console.log('    ✓ Seeded: name field (generic)')

            // Entry 4: "name" field - instructors variation (Czech pending)
            await db.exec(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (
                    'name',
                    'instructors',
                    'field',
                    '{"de": "Vor- und Nachname", "en": "Full name", "cz": "Vor- und Nachname"}'::jsonb,
                    'cz'
                )
            `)
            console.log('    ✓ Seeded: name field (instructors variation, cz pending)')
        } else {
            // SQLite - use TEXT for JSONB
            await db.exec(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (
                    'ok',
                    'false',
                    'button',
                    '{"de": "ok", "en": "ok", "cz": "ok"}',
                    'ok'
                )
            `)
            console.log('    ✓ Seeded: ok button (all languages same)')

            await db.exec(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (
                    'abbrechen',
                    'false',
                    'button',
                    '{"de": "abbrechen", "en": "cancel", "cz": "zrusit"}',
                    'ok'
                )
            `)
            console.log('    ✓ Seeded: abbrechen button (de/en/cz)')

            await db.exec(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (
                    'name',
                    'false',
                    'field',
                    '{"de": "Titel", "en": "Heading", "cz": "titul"}',
                    'ok'
                )
            `)
            console.log('    ✓ Seeded: name field (generic)')

            await db.exec(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (
                    'name',
                    'instructors',
                    'field',
                    '{"de": "Vor- und Nachname", "en": "Full name", "cz": "Vor- und Nachname"}',
                    'cz'
                )
            `)
            console.log('    ✓ Seeded: name field (instructors variation, cz pending)')
        }

        console.log('\n✅ Chapter 2 completed: i18n_codes table created and seeded')

        // ===================================================================
        // CHAPTER 3: Add status_id field to projects table
        // ===================================================================
        console.log('\n📖 Chapter 3: Add status_id field to projects table')

        // -------------------------------------------------------------------
        // 3.1: Add status_id field to projects table
        // -------------------------------------------------------------------
        console.log('\n  🏷️  Adding status_id field to projects...')

        // Add status_id column with default value 18 (status 'new' for projects)
        await db.exec(`
            ALTER TABLE projects 
            ADD COLUMN status_id INTEGER DEFAULT 18 REFERENCES status(id)
        `)

        // Update existing entries to have status_id = 18
        await db.exec(`
            UPDATE projects 
            SET status_id = 18 
            WHERE status_id IS NULL
        `)

        // Make status_id NOT NULL
        await db.exec(`
            ALTER TABLE projects 
            ALTER COLUMN status_id SET NOT NULL
        `)

        console.log('    ✓ status_id field added to projects')

        // -------------------------------------------------------------------
        // 3.2: Create trigger for automatic page creation on status change
        // -------------------------------------------------------------------
        console.log('\n  🔄 Creating trigger for automatic page creation...')

        // Drop old trigger from migration 013 if it exists
        await db.exec(`
            DROP TRIGGER IF EXISTS trigger_create_project_pages ON projects
        `)
        await db.exec(`
            DROP FUNCTION IF EXISTS create_project_pages()
        `)

        // Create new trigger function for status_id changes
        await db.exec(`
            CREATE OR REPLACE FUNCTION create_project_pages_on_status()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Only trigger when status_id changes to 19 (demo) or 20 (progress)
                IF (OLD.status_id IS DISTINCT FROM NEW.status_id) AND 
                   (NEW.status_id = 19 OR NEW.status_id = 20) THEN
                    
                    -- Conditional chain: each creates a page and continues to next
                    -- (exit on true means: if condition is true, execute and move to next)
                    
                    -- 1. If is_service = false, create landing page (if doesn't exist)
                    IF NEW.is_service = FALSE THEN
                        INSERT INTO pages (project, page_type, header_type)
                        SELECT NEW.id, 'landing', 'simple'
                        WHERE NOT EXISTS (
                            SELECT 1 FROM pages 
                            WHERE project = NEW.id AND page_type = 'landing'
                        );
                    END IF;
                    
                    -- 2. If is_onepage = false, create posts page (if doesn't exist)
                    IF NEW.is_onepage = FALSE THEN
                        INSERT INTO pages (project, page_type, header_type)
                        SELECT NEW.id, 'post', 'simple'
                        WHERE NOT EXISTS (
                            SELECT 1 FROM pages 
                            WHERE project = NEW.id AND page_type = 'post'
                        );
                    END IF;
                    
                    -- 3. If is_topic = false, create events page (if doesn't exist)
                    IF NEW.is_topic = FALSE THEN
                        INSERT INTO pages (project, page_type, header_type)
                        SELECT NEW.id, 'event', 'simple'
                        WHERE NOT EXISTS (
                            SELECT 1 FROM pages 
                            WHERE project = NEW.id AND page_type = 'event'
                        );
                    END IF;
                    
                    -- 4. If team_page = 'yes', create team page (if doesn't exist)
                    IF NEW.team_page = 'yes' THEN
                        INSERT INTO pages (project, page_type, header_type)
                        SELECT NEW.id, 'team', 'simple'
                        WHERE NOT EXISTS (
                            SELECT 1 FROM pages 
                            WHERE project = NEW.id AND page_type = 'team'
                        );
                    END IF;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)

        // Create the trigger
        await db.exec(`
            CREATE TRIGGER trigger_create_project_pages_on_status
            AFTER UPDATE ON projects
            FOR EACH ROW
            WHEN (OLD.status_id IS DISTINCT FROM NEW.status_id)
            EXECUTE FUNCTION create_project_pages_on_status()
        `)

        console.log('    ✓ Trigger for automatic page creation created')

        // -------------------------------------------------------------------
        // 3.3: Create index for status_id
        // -------------------------------------------------------------------
        console.log('\n  📇 Creating index for projects.status_id...')

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_projects_status_id ON projects(status_id)
        `)

        console.log('    ✓ Index created')

        console.log('\n✅ Chapter 3 completed: status_id field added to projects')

        // ===================================================================
        // CHAPTER 4: Create interactions Table
        // ===================================================================
        console.log('\n📖 Chapter 4: Create interactions Table')

        // -------------------------------------------------------------------
        // 4.1: Create interactions table
        // -------------------------------------------------------------------
        console.log('\n  📋 Creating interactions table...')

        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS interactions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    name TEXT NOT NULL,
                    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    status_id INTEGER NOT NULL REFERENCES status(id),
                    actions JSONB,
                    to_mail TEXT,
                    from_mail TEXT,
                    subject TEXT,
                    md TEXT,
                    fields JSONB
                )
            `)

            // Create trigger to enforce status_id belongs to interactions table
            await db.exec(`
                CREATE OR REPLACE FUNCTION check_interactions_status()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM status 
                        WHERE id = NEW.status_id AND "table" = 'interactions'
                    ) THEN
                        RAISE EXCEPTION 'status_id must reference a status entry for table ''interactions''';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            await db.exec(`
                CREATE TRIGGER trigger_check_interactions_status
                BEFORE INSERT OR UPDATE ON interactions
                FOR EACH ROW
                EXECUTE FUNCTION check_interactions_status()
            `)

            // Create indexes for common query patterns
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_user_id 
                ON interactions(user_id)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_project_id 
                ON interactions(project_id)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_status_id 
                ON interactions(status_id)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_timestamp 
                ON interactions(timestamp DESC)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_name 
                ON interactions(name)
            `)

            console.log('    ✓ Created interactions table with indexes (PostgreSQL)')

            // Seed status entries for interactions table
            console.log('\n  📝 Seeding status entries for interactions...')

            const interactionsStatuses = [
                {
                    value: 0,
                    name: 'new',
                    description: 'New interaction',
                    name_i18n: { de: 'neu', en: 'new', cz: 'nový' },
                    desc_i18n: { de: 'Neue Interaktion', en: 'New interaction', cz: 'Nová interakce' }
                },
                {
                    value: 1,
                    name: 'pending',
                    description: 'Pending review',
                    name_i18n: { de: 'ausstehend', en: 'pending', cz: 'čekající' },
                    desc_i18n: { de: 'Ausstehende Überprüfung', en: 'Pending review', cz: 'Čeká na kontrolu' }
                },
                {
                    value: 2,
                    name: 'processed',
                    description: 'Processed',
                    name_i18n: { de: 'verarbeitet', en: 'processed', cz: 'zpracováno' },
                    desc_i18n: { de: 'Verarbeitet', en: 'Processed', cz: 'Zpracováno' }
                },
                {
                    value: 3,
                    name: 'completed',
                    description: 'Completed',
                    name_i18n: { de: 'abgeschlossen', en: 'completed', cz: 'dokončeno' },
                    desc_i18n: { de: 'Abgeschlossen', en: 'Completed', cz: 'Dokončeno' }
                },
                {
                    value: 9,
                    name: 'spam',
                    description: 'Marked as spam',
                    name_i18n: { de: 'Spam', en: 'spam', cz: 'spam' },
                    desc_i18n: { de: 'Als Spam markiert', en: 'Marked as spam', cz: 'Označeno jako spam' }
                }
            ]

            for (const status of interactionsStatuses) {
                await db.run(
                    `INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (name, "table") DO NOTHING`,
                    [
                        status.value,
                        status.name,
                        'interactions',
                        status.description,
                        JSON.stringify(status.name_i18n),
                        JSON.stringify(status.desc_i18n)
                    ]
                )
            }

            console.log(`    ✓ Seeded ${interactionsStatuses.length} status entries for interactions`)

        } else {
            // SQLite
            await db.exec(`
                CREATE TABLE IF NOT EXISTS interactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    name TEXT NOT NULL,
                    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    status_id INTEGER NOT NULL REFERENCES status(id),
                    actions TEXT,
                    to_mail TEXT,
                    from_mail TEXT,
                    subject TEXT,
                    md TEXT,
                    fields TEXT
                )
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_user_id 
                ON interactions(user_id)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_project_id 
                ON interactions(project_id)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_status_id 
                ON interactions(status_id)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_timestamp 
                ON interactions(timestamp DESC)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_interactions_name 
                ON interactions(name)
            `)

            console.log('    ✓ Created interactions table with indexes (SQLite)')
        }

        console.log('\n✅ Chapter 4 completed: interactions table created')
        console.log('✅ Migration 020 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 020: Removing i18n core, i18n_codes table, projects.status_id, and interactions table...')

        // Drop interactions table (Chapter 4)
        await db.exec(`DROP TRIGGER IF EXISTS trigger_check_interactions_status ON interactions`)
        await db.exec(`DROP FUNCTION IF EXISTS check_interactions_status()`)
        await db.exec(`DROP TABLE IF EXISTS interactions`)
        console.log('  ✓ Dropped interactions table and related objects')

        // Drop status_id field and related objects from projects (Chapter 3)
        console.log('  → Removing projects.status_id and related objects...')

        await db.exec(`DROP TRIGGER IF EXISTS trigger_create_project_pages_on_status ON projects`)
        await db.exec(`DROP FUNCTION IF EXISTS create_project_pages_on_status()`)
        await db.exec(`DROP INDEX IF EXISTS idx_projects_status_id`)
        await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS status_id`)

        console.log('  ✓ Removed projects.status_id field and related objects')

        // Drop i18n_codes table (Chapter 2)
        await db.exec(`DROP TABLE IF EXISTS i18n_codes`)
        console.log('  ✓ Dropped i18n_codes table')

        const tables = ['participants', 'instructors', 'tasks', 'locations', 'users']
        const tablesWithStatus = ['events', 'posts', 'participants', 'instructors', 'tasks', 'locations', 'users']

        // Drop status_display columns (Chapter 1)
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
