/**
 * Migration 019: Add Tags, Status, and IDs
 * 
 * IMPORTANT: Support for SQLite is completely dropped from migration 019 onwards.
 * Reason: Implementation follows PostgreSQL-specific syntax (custom types, computed columns, etc.)
 * 
 * Migration Chapters:
 * - Chapter 1: Add System Tables (tags, status)
 * - Chapter 2: Migrate Users to Support Auto-ID
 * - Chapter 3: Migrate File Tables to Support Auto-ID and Status
 * - Chapter 4: Integrate Users, Participants and Instructors
 * - Chapter 5: Align Projects, Add Auto-ID
 * - Chapter 5B: Convert Events/Posts project to project_id
 * - Chapter 5B.4: Create Images Table with Custom Types
 * - Chapter 6: Align Tasks, Add Status FK
 * - Chapter 7: Align Instructors, Add header_size
 * - Chapter 8: Enable Native Tags (events, posts)
 * - Chapter 9: Surface regio_id (events, posts, instructors)
 * - Chapter 10: Block Publishing of Invalid Events
 * - Chapter 11: Extend Projects with Page/Aside/Header/Footer Options
 * - Chapter 12: Extend Pages with Page/Aside/Header/Footer Options
 * - Chapter 13: Add img_id Foreign Key to Entity Tables
 * - Chapter 14: Add Image Performance Fields to Entity Tables
 * 
 * This migration creates the foundational tables for the tag and status system,
 * and migrates the users table, file tables, and projects to use auto-incrementing IDs.
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '019_add_tags_status_ids',
    description: 'Add tags, status tables and migrate users and file tables to auto-ID',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 019: Add tags, status, and IDs...')

        // ===================================================================
        // CHAPTER 1: Add System Tables
        // ===================================================================
        console.log('\n📖 Chapter 1: Add System Tables')

        // -------------------------------------------------------------------
        // 1.1: Create tags table
        // -------------------------------------------------------------------
        console.log('\n  🏷️  Creating tags table...')

        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS tags (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    name_i18n JSONB,
                    desc_i18n JSONB
                )
            `)

            // Create unique index on name
            await db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name 
                ON tags(name)
            `)
        } else {
            // SQLite
            await db.exec(`
                CREATE TABLE IF NOT EXISTS tags (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    name_i18n TEXT,
                    desc_i18n TEXT
                )
            `)

            await db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name 
                ON tags(name)
            `)
        }

        console.log('    ✓ Tags table created with unique name index')

        // -------------------------------------------------------------------
        // 1.2: Create status table
        // -------------------------------------------------------------------
        console.log('\n  📊 Creating status table...')

        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS status (
                    id SERIAL PRIMARY KEY,
                    value SMALLINT NOT NULL,
                    name TEXT NOT NULL,
                    "table" TEXT NOT NULL CHECK ("table" IN ('projects', 'events', 'posts', 'persons', 'users' , 'tasks' , 'interactions', 'images')),
                    description TEXT,
                    name_i18n JSONB,
                    desc_i18n JSONB
                )
            `)

            // Create indexes
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_status_name 
                ON status(name)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_status_table 
                ON status("table")
            `)

            await db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_status_name_table 
                ON status(name, "table")
            `)
        } else {
            // SQLite
            await db.exec(`
                CREATE TABLE IF NOT EXISTS status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    value INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    "table" TEXT NOT NULL CHECK ("table" IN ('projects', 'events', 'posts', 'persons', 'users', 'tasks', 'interactions', 'images')),
                    description TEXT,
                    name_i18n TEXT,
                    desc_i18n TEXT,
                    UNIQUE(name, "table")
                )
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_status_name 
                ON status(name)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_status_table 
                ON status("table")
            `)
        }

        console.log('    ✓ Status table created with indexes on name, table, and (name+table) unique')

        // -------------------------------------------------------------------
        // 1.3: Populate status table with task statuses
        // -------------------------------------------------------------------
        console.log('\n  📝 Populating status table with task statuses...')

        const taskStatuses = [
            {
                value: 0,
                name: 'new',
                table: 'tasks',
                description: 'Newly created task',
                name_i18n: { de: 'Neu', en: 'New', cz: 'Nový' },
                desc_i18n: { de: 'Neu erstellte Aufgabe', en: 'Newly created task', cz: 'Nově vytvořený úkol' }
            },
            {
                value: 1,
                name: 'idea',
                table: 'tasks',
                description: 'Task idea/concept',
                name_i18n: { de: 'Idee', en: 'Idea', cz: 'Nápad' },
                desc_i18n: { de: 'Aufgaben-Idee/Konzept', en: 'Task idea/concept', cz: 'Nápad/koncept úkolu' }
            },
            {
                value: 2,
                name: 'draft',
                table: 'tasks',
                description: 'Draft task',
                name_i18n: { de: 'Entwurf', en: 'Draft', cz: 'Koncept' },
                desc_i18n: { de: 'Entwurfsaufgabe', en: 'Draft task', cz: 'Konceptový úkol' }
            },
            {
                value: 4,
                name: 'active',
                table: 'tasks',
                description: 'Active/in-progress task',
                name_i18n: { de: 'Aktiv', en: 'Active', cz: 'Aktivní' },
                desc_i18n: { de: 'Aktive/laufende Aufgabe', en: 'Active/in-progress task', cz: 'Aktivní/probíhající úkol' }
            },
            {
                value: 5,
                name: 'final',
                table: 'tasks',
                description: 'Completed task',
                name_i18n: { de: 'Abgeschlossen', en: 'Completed', cz: 'Dokončeno' },
                desc_i18n: { de: 'Abgeschlossene Aufgabe', en: 'Completed task', cz: 'Dokončený úkol' }
            },
            {
                value: 8,
                name: 'reopen',
                table: 'tasks',
                description: 'Reopened task',
                name_i18n: { de: 'Wiedereröffnet', en: 'Reopened', cz: 'Znovu otevřeno' },
                desc_i18n: { de: 'Wiedereröffnete Aufgabe', en: 'Reopened task', cz: 'Znovu otevřený úkol' }
            },
            {
                value: 16,
                name: 'trash',
                table: 'tasks',
                description: 'Trashed task',
                name_i18n: { de: 'Papierkorb', en: 'Trash', cz: 'Koš' },
                desc_i18n: { de: 'Gelöschte Aufgabe', en: 'Trashed task', cz: 'Smazaný úkol' }
            }
        ]

        for (const status of taskStatuses) {
            if (isPostgres) {
                await db.exec(`
                    INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (
                        ${status.value}, 
                        '${status.name}', 
                        '${status.table}', 
                        '${status.description}',
                        '${JSON.stringify(status.name_i18n)}'::jsonb,
                        '${JSON.stringify(status.desc_i18n)}'::jsonb
                    )
                    ON CONFLICT (name, "table") DO NOTHING
                `)
            } else {
                await db.exec(`
                    INSERT OR IGNORE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (
                        ${status.value}, 
                        '${status.name}', 
                        '${status.table}', 
                        '${status.description}',
                        '${JSON.stringify(status.name_i18n)}',
                        '${JSON.stringify(status.desc_i18n)}'
                    )
                `)
            }
        }

        console.log('    ✓ Task statuses populated with i18n translations (new, idea, draft, active, final, reopen, trash)')

        // -------------------------------------------------------------------
        // 1.4: Populate status table with events statuses  
        // -------------------------------------------------------------------
        console.log('\n  📝 Populating status table with events statuses...')

        const eventsStatuses = [
            { value: 2, name: 'draft', table: 'events', description: 'Draft version', name_i18n: { de: 'Entwurf', cz: 'Koncept' }, desc_i18n: { de: 'Entwurfsversion', cz: 'Konceptová verze' } },
            { value: 3, name: 'publish', table: 'events', description: 'Published', name_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' }, desc_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' } },
            { value: 4, name: 'released', table: 'events', description: 'Released', name_i18n: { de: 'Freigegeben', cz: 'Vydáno' }, desc_i18n: { de: 'Freigegeben', cz: 'Vydáno' } },
            { value: 6, name: 'confirmed', table: 'events', description: 'Confirmed event', name_i18n: { de: 'Bestätigt', cz: 'Potvrzeno' }, desc_i18n: { de: 'Bestätigte Veranstaltung', cz: 'Potvrzená událost' } },
            { value: 8, name: 'running', table: 'events', description: 'Currently running', name_i18n: { de: 'Läuft', cz: 'Probíhá' }, desc_i18n: { de: 'Läuft gerade', cz: 'Právě probíhá' } },
            { value: 9, name: 'passed', table: 'events', description: 'Event has passed', name_i18n: { de: 'Vergangen', cz: 'Proběhlo' }, desc_i18n: { de: 'Veranstaltung ist vorbei', cz: 'Událost proběhla' } },
            { value: 12, name: 'documented', table: 'events', description: 'Documented', name_i18n: { de: 'Dokumentiert', cz: 'Zdokumentováno' }, desc_i18n: { de: 'Dokumentiert', cz: 'Zdokumentováno' } }
        ]

        for (const status of eventsStatuses) {
            if (isPostgres) {
                await db.exec(`
                    INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', '${status.table}', '${status.description}', '${JSON.stringify(status.name_i18n)}'::jsonb, '${JSON.stringify(status.desc_i18n)}'::jsonb)
                    ON CONFLICT (name, "table") DO NOTHING
                `)
            } else {
                await db.exec(`
                    INSERT OR IGNORE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', '${status.table}', '${status.description}', '${JSON.stringify(status.name_i18n)}', '${JSON.stringify(status.desc_i18n)}')
                `)
            }
        }

        console.log('    ✓ Events statuses populated with i18n translations (draft, publish, released, confirmed, running, passed, documented)')

        // -------------------------------------------------------------------
        // 1.5: Populate status table with posts statuses
        // -------------------------------------------------------------------
        console.log('\n  📝 Populating status table with posts statuses...')

        const postsStatuses = [
            { value: 2, name: 'draft', table: 'posts', description: 'Draft version', name_i18n: { de: 'Entwurf', cz: 'Koncept' }, desc_i18n: { de: 'Entwurfsversion', cz: 'Konceptová verze' } },
            { value: 3, name: 'publish', table: 'posts', description: 'Published', name_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' }, desc_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' } },
            { value: 4, name: 'released', table: 'posts', description: 'Released', name_i18n: { de: 'Freigegeben', cz: 'Vydáno' }, desc_i18n: { de: 'Freigegeben', cz: 'Vydáno' } }
        ]

        for (const status of postsStatuses) {
            if (isPostgres) {
                await db.exec(`
                    INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', '${status.table}', '${status.description}', '${JSON.stringify(status.name_i18n)}'::jsonb, '${JSON.stringify(status.desc_i18n)}'::jsonb)
                    ON CONFLICT (name, "table") DO NOTHING
                `)
            } else {
                await db.exec(`
                    INSERT OR IGNORE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', '${status.table}', '${status.description}', '${JSON.stringify(status.name_i18n)}', '${JSON.stringify(status.desc_i18n)}')
                `)
            }
        }

        console.log('    ✓ Posts statuses populated with i18n translations (draft, publish, released)')

        // -------------------------------------------------------------------
        // 1.6: Populate common status entries for all tables
        // -------------------------------------------------------------------
        console.log('\n  📊 Populating common status entries for all tables...')

        // Common statuses for projects, events, posts, persons, users
        const commonTables = ['projects', 'events', 'posts', 'persons', 'users', 'users', 'interactions']
        const commonStatuses = [
            { value: 0, name: 'new', description: 'Newly created', name_i18n: { de: 'Neu', en: 'New', cz: 'Nový' }, desc_i18n: { de: 'Neu erstellt', en: 'Newly created', cz: 'Nově vytvořený' } },
            { value: 1, name: 'demo', description: 'Demo/example data', name_i18n: { de: 'Demo', en: 'Demo', cz: 'Demo' }, desc_i18n: { de: 'Demo-/Beispieldaten', en: 'Demo/example data', cz: 'Demonstrační/ukázková data' } },
            { value: 2, name: 'progress', description: 'Work in progress', name_i18n: { de: 'In Arbeit', en: 'In progress', cz: 'Probíhá' }, desc_i18n: { de: 'In Bearbeitung', en: 'Work in progress', cz: 'Probíhající práce' } },
            { value: 4, name: 'done', description: 'Completed', name_i18n: { de: 'Fertig', en: 'Done', cz: 'Hotovo' }, desc_i18n: { de: 'Abgeschlossen', en: 'Completed', cz: 'Dokončeno' } },
            { value: 16, name: 'trash', description: 'In trash/deleted', name_i18n: { de: 'Papierkorb', en: 'Trash', cz: 'Koš' }, desc_i18n: { de: 'Im Papierkorb/gelöscht', en: 'In trash/deleted', cz: 'V koši/smazáno' } },
            { value: 32, name: 'archived', description: 'Archived', name_i18n: { de: 'Archiviert', en: 'Archived', cz: 'Archivováno' }, desc_i18n: { de: 'Archiviert', en: 'Archived', cz: 'Archivováno' } },
            { value: 48, name: 'linked', description: 'Linked/referenced data', name_i18n: { de: 'Verknüpft', en: 'Linked', cz: 'Propojeno' }, desc_i18n: { de: 'Verknüpfte/referenzierte Daten', en: 'Linked/referenced data', cz: 'Propojená/odkazovaná data' } }
        ]

        for (const table of commonTables) {
            for (const status of commonStatuses) {
                if (isPostgres) {
                    await db.exec(`
                        INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                        VALUES (${status.value}, '${status.name}', '${table}', '${status.description}', '${JSON.stringify(status.name_i18n)}'::jsonb, '${JSON.stringify(status.desc_i18n)}'::jsonb)
                        ON CONFLICT (name, "table") DO NOTHING
                    `)
                } else {
                    await db.exec(`
                        INSERT OR IGNORE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                        VALUES (${status.value}, '${status.name}', '${table}', '${status.description}', '${JSON.stringify(status.name_i18n)}', '${JSON.stringify(status.desc_i18n)}')
                    `)
                }
            }
        }

        console.log('    ✓ Common statuses populated for projects, events, posts, persons, users')

        // -------------------------------------------------------------------
        // 1.7: Populate projects-specific statuses
        // -------------------------------------------------------------------
        console.log('\n  📝 Populating projects-specific statuses...')

        const projectsSpecificStatuses = [
            { value: 2, name: 'draft', description: 'Draft version', name_i18n: { de: 'Entwurf', en: 'Draft', cz: 'Koncept' }, desc_i18n: { de: 'Entwurfsversion', en: 'Draft version', cz: 'Konceptová verze' } },
            { value: 3, name: 'publish', description: 'Published', name_i18n: { de: 'Veröffentlicht', en: 'Published', cz: 'Zveřejněno' }, desc_i18n: { de: 'Veröffentlicht', en: 'Published', cz: 'Zveřejněno' } },
            { value: 4, name: 'released', description: 'Released', name_i18n: { de: 'Freigegeben', en: 'Released', cz: 'Vydáno' }, desc_i18n: { de: 'Freigegeben', en: 'Released', cz: 'Vydáno' } }
        ]

        for (const status of projectsSpecificStatuses) {
            if (isPostgres) {
                await db.exec(`
                    INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', 'projects', '${status.description}', '${JSON.stringify(status.name_i18n)}'::jsonb, '${JSON.stringify(status.desc_i18n)}'::jsonb)
                    ON CONFLICT (name, "table") DO NOTHING
                `)
            } else {
                await db.exec(`
                    INSERT OR IGNORE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', 'projects', '${status.description}', '${JSON.stringify(status.name_i18n)}', '${JSON.stringify(status.desc_i18n)}')
                `)
            }
        }

        console.log('    ✓ Projects-specific statuses populated')

        // -------------------------------------------------------------------
        // 1.8: Populate users-specific statuses
        // -------------------------------------------------------------------
        console.log('\n  📝 Populating users-specific statuses...')

        const usersSpecificStatuses = [
            { value: 0, name: 'activated', description: 'has logged in', name_i18n: { de: 'aktiviert', en: 'activated', cz: 'aktivni' }, desc_i18n: { de: 'erstes login absolviert', en: 'first login', cz: 'privni login' } },
            { value: 2, name: 'verified', description: 'Email verified', name_i18n: { de: 'Verifiziert', en: 'Verified', cz: 'Ověřeno' }, desc_i18n: { de: 'E-Mail verifiziert', en: 'Email verified', cz: 'E-mail ověřen' } },
            { value: 3, name: 'publish', description: 'Public profile', name_i18n: { de: 'Öffentlich', en: 'Public', cz: 'Veřejný' }, desc_i18n: { de: 'Öffentliches Profil', en: 'Public profile', cz: 'Veřejný profil' } },
            { value: 4, name: 'synced', description: 'Synced with external system', name_i18n: { de: 'Synchronisiert', en: 'Synced', cz: 'Synchronizováno' }, desc_i18n: { de: 'Mit externem System synchronisiert', en: 'Synced with external system', cz: 'Synchronizováno s externím systémem' } },
            { value: 6, name: 'public', description: 'Public user', name_i18n: { de: 'Öffentlicher Benutzer', en: 'Public user', cz: 'Veřejný uživatel' }, desc_i18n: { de: 'Öffentlicher Benutzer', en: 'Public user', cz: 'Veřejný uživatel' } }
        ]

        for (const status of usersSpecificStatuses) {
            if (isPostgres) {
                await db.exec(`
                    INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', 'users', '${status.description}', '${JSON.stringify(status.name_i18n)}'::jsonb, '${JSON.stringify(status.desc_i18n)}'::jsonb)
                    ON CONFLICT (name, "table") DO NOTHING
                `)
            } else {
                await db.exec(`
                    INSERT OR IGNORE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', 'users', '${status.description}', '${JSON.stringify(status.name_i18n)}', '${JSON.stringify(status.desc_i18n)}')
                `)
            }
        }

        console.log('    ✓ Users-specific statuses populated')

        // -------------------------------------------------------------------
        // 1.9: Populate persons-specific statuses
        // -------------------------------------------------------------------
        console.log('\n  📝 Populating persons-specific statuses...')

        const personsSpecificStatuses = [
            { value: 2, name: 'active', description: 'Active person', name_i18n: { de: 'Aktiv', en: 'Active', cz: 'Aktivní' }, desc_i18n: { de: 'Aktive Person', en: 'Active person', cz: 'Aktivní osoba' } },
            { value: 4, name: 'synced', description: 'Synced with external system', name_i18n: { de: 'Synchronisiert', en: 'Synced', cz: 'Synchronizováno' }, desc_i18n: { de: 'Mit externem System synchronisiert', en: 'Synced with external system', cz: 'Synchronizováno s externím systémem' } },
            { value: 6, name: 'public', description: 'Public person', name_i18n: { de: 'Öffentlich', en: 'Public', cz: 'Veřejný' }, desc_i18n: { de: 'Öffentliche Person', en: 'Public person', cz: 'Veřejná osoba' } },
            { value: 32, name: 'archived', description: 'Archived person', name_i18n: { de: 'Archiviert', en: 'Archived', cz: 'Archivováno' }, desc_i18n: { de: 'Archivierte Person', en: 'Archived person', cz: 'Archivovaná osoba' } },
            { value: 16, name: 'deleted', description: 'Deleted person', name_i18n: { de: 'Gelöscht', en: 'Deleted', cz: 'Smazáno' }, desc_i18n: { de: 'Gelöschte Person', en: 'Deleted person', cz: 'Smazaná osoba' } }
        ]

        for (const status of personsSpecificStatuses) {
            if (isPostgres) {
                await db.exec(`
                    INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', 'persons', '${status.description}', '${JSON.stringify(status.name_i18n)}'::jsonb, '${JSON.stringify(status.desc_i18n)}'::jsonb)
                    ON CONFLICT (name, "table") DO NOTHING
                `)
            } else {
                await db.exec(`
                    INSERT OR IGNORE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', 'persons', '${status.description}', '${JSON.stringify(status.name_i18n)}', '${JSON.stringify(status.desc_i18n)}')
                `)
            }
        }

        console.log('    ✓ Persons-specific statuses populated')

        // Images-specific statuses
        const imagesSpecificStatuses = [
            { value: 0, name: 'new', description: 'New image', name_i18n: { de: 'Neu', en: 'New', cz: 'Nový' }, desc_i18n: { de: 'Neues Bild', en: 'New image', cz: 'Nový obrázek' } },
            { value: 1, name: 'demo', description: 'Demo image', name_i18n: { de: 'Demo', en: 'Demo', cz: 'Demo' }, desc_i18n: { de: 'Demo-Bild', en: 'Demo image', cz: 'Demo obrázek' } },
            { value: 2, name: 'draft', description: 'Draft image', name_i18n: { de: 'Entwurf', en: 'Draft', cz: 'Koncept' }, desc_i18n: { de: 'Entwurf-Bild', en: 'Draft image', cz: 'Koncept obrázku' } },
            { value: 4, name: 'done', description: 'Published image', name_i18n: { de: 'Fertig', en: 'Done', cz: 'Hotovo' }, desc_i18n: { de: 'Veröffentlichtes Bild', en: 'Published image', cz: 'Publikovaný obrázek' } },
            { value: 16, name: 'trash', description: 'Trashed image', name_i18n: { de: 'Papierkorb', en: 'Trash', cz: 'Koš' }, desc_i18n: { de: 'Gelöschtes Bild', en: 'Trashed image', cz: 'Smazaný obrázek' } },
            { value: 32, name: 'archived', description: 'Archived image', name_i18n: { de: 'Archiviert', en: 'Archived', cz: 'Archivováno' }, desc_i18n: { de: 'Archiviertes Bild', en: 'Archived image', cz: 'Archivovaný obrázek' } }
        ]

        for (const status of imagesSpecificStatuses) {
            if (isPostgres) {
                await db.exec(`
                    INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', 'images', '${status.description}', '${JSON.stringify(status.name_i18n)}'::jsonb, '${JSON.stringify(status.desc_i18n)}'::jsonb)
                    ON CONFLICT (name, "table") DO NOTHING
                `)
            } else {
                await db.exec(`
                    INSERT OR IGNORE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                    VALUES (${status.value}, '${status.name}', 'images', '${status.description}', '${JSON.stringify(status.name_i18n)}', '${JSON.stringify(status.desc_i18n)}')
                `)
            }
        }

        console.log('    ✓ Images-specific statuses populated')

        console.log('\n✅ Chapter 1 completed: All status entries populated for all tables')

        // ===================================================================
        // CHAPTER 2: Migrate Users to Support Auto-ID
        // ===================================================================
        console.log('\n📖 Chapter 2: Migrate Users to Support Auto-ID')

        // Check if migration already partially completed
        const checkUsersOld = await db.get(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users_old'
            ) as exists
        `, [])

        if ((checkUsersOld as any).exists) {
            console.log('  ⚠️  users_old table already exists - migration may have partially run')
            console.log('  🔄 Cleaning up and restarting Chapter 2...')
            await db.exec(`DROP TABLE IF EXISTS users_old CASCADE`)
        }

        // -------------------------------------------------------------------
        // 2.1: Create new users table with auto-incrementing ID
        // -------------------------------------------------------------------
        console.log('\n  👤 Migrating users table structure...')

        if (isPostgres) {
            // Step 1: Rename old users table
            await db.exec(`ALTER TABLE users RENAME TO users_old`)
            console.log('    ✓ Renamed users to users_old')

            // Step 2: Create new users table with auto-incrementing id
            // Note: instructor_id FK constraint will be added in Chapter 4 after instructors migration
            await db.exec(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    sysmail TEXT NOT NULL UNIQUE CHECK (sysmail ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
                    extmail TEXT UNIQUE CHECK (extmail IS NULL OR extmail ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
                    username TEXT NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'base')),
                    status_id INTEGER REFERENCES status(id),
                    instructor_id TEXT,
                    participant_id INTEGER,
                    lang TEXT NOT NULL DEFAULT 'de' CHECK (lang IN ('de', 'en', 'cz')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)
            console.log('    ✓ Created new users table with auto-incrementing id and lang field')

            // Step 3: Add constraint to prevent extmail from being used as sysmail anywhere
            await db.exec(`
                CREATE OR REPLACE FUNCTION check_email_uniqueness()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Check if extmail is used as sysmail by another user
                    IF NEW.extmail IS NOT NULL AND EXISTS (
                        SELECT 1 FROM users WHERE sysmail = NEW.extmail AND id != NEW.id
                    ) THEN
                        RAISE EXCEPTION 'Email % is already used as system email', NEW.extmail;
                    END IF;
                    
                    -- Check if sysmail is used as extmail by another user
                    IF EXISTS (
                        SELECT 1 FROM users WHERE extmail = NEW.sysmail AND id != NEW.id
                    ) THEN
                        RAISE EXCEPTION 'Email % is already used as external email', NEW.sysmail;
                    END IF;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            await db.exec(`
                CREATE TRIGGER trigger_check_email_uniqueness
                BEFORE INSERT OR UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION check_email_uniqueness()
            `)
            console.log('    ✓ Added email uniqueness constraints')

            // Step 4: Get default status ID for 'new' status
            const newStatus = await db.get(
                `SELECT id FROM status WHERE name = $1 AND "table" = $2`,
                ['new', 'users']
            )
            const defaultStatusId = newStatus ? (newStatus as any).id : null

            // Step 5: Migrate data from old table to new table
            console.log('    ℹ️  Migrating user data...')

            const oldUsers = await db.all('SELECT * FROM users_old')
            const userIdMap: Record<string, number> = {}

            for (const oldUser of oldUsers as any[]) {
                // Convert old TEXT id to email format for sysmail
                // If it's already an email, use it; otherwise append @theaterpedia.org
                const oldId = String(oldUser.id) // Ensure it's a string
                const sysmail = oldId.includes('@')
                    ? oldId
                    : `${oldId}@theaterpedia.org`

                const row = await db.get(
                    `INSERT INTO users (sysmail, username, password, role, status_id, instructor_id, lang, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING id`,
                    [
                        sysmail, // Convert old id to email format
                        oldUser.username,
                        oldUser.password,
                        oldUser.role,
                        defaultStatusId,
                        oldUser.instructor_id,
                        'de', // Default language for migrated users
                        oldUser.created_at,
                        oldUser.updated_at
                    ]
                )

                const newId = row.id
                userIdMap[oldUser.id] = newId
                console.log(`      → Migrated user ${oldUser.username}: ${oldUser.id} → id:${newId} (${sysmail})`)
            }

            // Step 6: Update foreign key references in other tables
            console.log('    ℹ️  Updating foreign key references...')

            // Update domains.admin_user_id
            for (const [oldId, newId] of Object.entries(userIdMap)) {
                await db.exec(`UPDATE domains SET admin_user_id = '${newId}' WHERE admin_user_id = '${oldId}'`)
            }
            console.log('      ✓ Updated domains.admin_user_id')

            // Update projects.owner_id
            for (const [oldId, newId] of Object.entries(userIdMap)) {
                await db.exec(`UPDATE projects SET owner_id = '${newId}' WHERE owner_id = '${oldId}'`)
            }
            console.log('      ✓ Updated projects.owner_id')

            // Update events.user_id (if exists)
            try {
                for (const [oldId, newId] of Object.entries(userIdMap)) {
                    await db.exec(`UPDATE events SET user_id = '${newId}' WHERE user_id = '${oldId}'`)
                }
                console.log('      ✓ Updated events.user_id')
            } catch (e) {
                console.log('      ℹ️  events.user_id column does not exist yet')
            }

            // Update project_members.user_id
            for (const [oldId, newId] of Object.entries(userIdMap)) {
                await db.exec(`UPDATE project_members SET user_id = '${newId}' WHERE user_id = '${oldId}'`)
            }
            console.log('      ✓ Updated project_members.user_id')

            // Step 7: Drop all old foreign key constraints BEFORE converting column types
            console.log('    ℹ️  Dropping old foreign key constraints before conversion...')

            await db.exec(`ALTER TABLE domains DROP CONSTRAINT IF EXISTS domains_admin_user_id_fkey`)
            await db.exec(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey`)
            await db.exec(`ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey`)
            await db.exec(`ALTER TABLE events DROP CONSTRAINT IF EXISTS events_user_id_fkey`)

            console.log('      ✓ Dropped old FK constraints')

            // Step 8: Convert column types to INTEGER
            console.log('    ℹ️  Converting foreign key column types to INTEGER...')

            // Convert domains.admin_user_id from TEXT to INTEGER
            // Handle NULLs and convert text representations of numbers
            try {
                await db.exec(`
                    ALTER TABLE domains 
                    ALTER COLUMN admin_user_id TYPE INTEGER 
                    USING CASE 
                        WHEN admin_user_id IS NULL THEN NULL
                        WHEN admin_user_id::TEXT ~ '^[0-9]+$' THEN admin_user_id::INTEGER
                        ELSE NULL
                    END
                `)
                console.log('      ✓ Converted domains.admin_user_id to INTEGER')
            } catch (error: any) {
                console.log('      ❌ Failed to convert domains.admin_user_id:', error.message)
                throw error
            }

            // Convert projects.owner_id from TEXT to INTEGER (if it's TEXT)
            try {
                await db.exec(`
                    ALTER TABLE projects 
                    ALTER COLUMN owner_id TYPE INTEGER 
                    USING CASE 
                        WHEN owner_id IS NULL THEN NULL
                        WHEN owner_id::TEXT ~ '^[0-9]+$' THEN owner_id::INTEGER
                        ELSE NULL
                    END
                `)
                console.log('      ✓ Converted projects.owner_id to INTEGER')
            } catch (error: any) {
                console.log('      ❌ Failed to convert projects.owner_id:', error.message)
                throw error
            }

            // Convert project_members.user_id from TEXT to INTEGER (if it's TEXT)
            try {
                await db.exec(`
                    ALTER TABLE project_members 
                    ALTER COLUMN user_id TYPE INTEGER 
                    USING CASE 
                        WHEN user_id IS NULL THEN NULL
                        WHEN user_id::TEXT ~ '^[0-9]+$' THEN user_id::INTEGER
                        ELSE NULL
                    END
                `)
                console.log('      ✓ Converted project_members.user_id to INTEGER')
            } catch (error: any) {
                console.log('      ❌ Failed to convert project_members.user_id:', error.message)
                throw error
            }

            // Step 9: Add new foreign key constraints to reference new INTEGER id field
            console.log('    ℹ️  Adding new foreign key constraints...')

            await db.exec(`
                ALTER TABLE domains 
                ADD CONSTRAINT domains_admin_user_id_fkey 
                FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL
            `)
            console.log('      ✓ Added domains.admin_user_id FK')

            await db.exec(`
                ALTER TABLE projects 
                ADD CONSTRAINT projects_owner_id_fkey 
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
            `)
            console.log('      ✓ Added projects.owner_id FK')

            await db.exec(`
                ALTER TABLE project_members 
                ADD CONSTRAINT project_members_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            `)
            console.log('      ✓ Added project_members.user_id FK')

            console.log('    ✓ Updated foreign key constraints')

            // Step 10: Drop old users table
            await db.exec(`DROP TABLE IF EXISTS users_old CASCADE`)
            console.log('    ✓ Dropped old users table')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: User migration requires manual handling')

            // SQLite doesn't support ALTER TABLE as flexibly, so we use a similar rename approach
            await db.exec(`ALTER TABLE users RENAME TO users_old`)

            await db.exec(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sysmail TEXT NOT NULL UNIQUE,
                    extmail TEXT UNIQUE,
                    username TEXT NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'base')),
                    status_id INTEGER REFERENCES status(id),
                    instructor_id TEXT REFERENCES instructors(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)

            // Migrate data
            await db.exec(`
                INSERT INTO users (sysmail, username, password, role, instructor_id, created_at, updated_at)
                SELECT id, username, password, role, instructor_id, created_at, updated_at
                FROM users_old
            `)

            // Note: Foreign key updates need to be handled in subsequent migrations
            console.log('    ⚠️  SQLite: Foreign key references need manual update in later migrations')
        }

        // ===================================================================
        // CHAPTER 3: Migrate File Tables to Support Auto-ID and Status
        // ===================================================================
        console.log('\n📖 Chapter 3: Migrate File Tables to Support Auto-ID and Status')
        console.log('  ℹ️  Migrating: participants, instructors, locations')
        console.log('  ℹ️  Note: events + posts status conversion is already done in earlier migrations')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 3.1: Migrate participants table
            // -------------------------------------------------------------------
            console.log('\n  👥 Migrating participants table...')

            // Backup existing table
            await db.exec(`ALTER TABLE participants RENAME TO participants_old`)

            // Create new table with auto-incrementing ID
            await db.exec(`
                CREATE TABLE participants (
                    id SERIAL PRIMARY KEY,
                    xmlid TEXT UNIQUE,
                    name TEXT NOT NULL,
                    age INTEGER,
                    city TEXT,
                    country_id TEXT,
                    cimg TEXT,
                    description TEXT,
                    event_xmlid TEXT,
                    type TEXT,
                    version_id TEXT,
                    status_id INTEGER REFERENCES status(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT
                )
            `)

            // Migrate data: Get default status_id for 'active' with filter 'persons'
            await db.exec(`
                INSERT INTO participants (
                    xmlid, name, age, city, country_id, cimg, description,
                    event_xmlid, type, version_id, status_id, created_at, updated_at
                )
                SELECT 
                    p.id,
                    p.name,
                    p.age,
                    p.city,
                    p.country_id,
                    p.cimg,
                    p.description,
                    p.event_id,
                    p.type,
                    p.version_id,
                    (SELECT s.id FROM status s WHERE s.name = 'active' AND s."table" = 'persons' LIMIT 1),
                    p.created_at,
                    p.updated_at
                FROM participants_old p
            `)

            // Drop old table
            await db.exec(`DROP TABLE participants_old`)
            console.log('    ✓ Participants migrated to auto-ID with status_id')

            // -------------------------------------------------------------------
            // 3.2: Migrate instructors table
            // -------------------------------------------------------------------
            console.log('\n  🎓 Migrating instructors table...')

            // Backup existing table
            await db.exec(`ALTER TABLE instructors RENAME TO instructors_old`)

            // Create new table with auto-incrementing ID
            await db.exec(`
                CREATE TABLE instructors (
                    id SERIAL PRIMARY KEY,
                    xmlid TEXT UNIQUE,
                    name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    city TEXT,
                    country_id TEXT,
                    cimg TEXT,
                    description TEXT,
                    event_xmlid TEXT,
                    version_id TEXT,
                    status_id INTEGER REFERENCES status(id),
                    multiproject TEXT DEFAULT 'yes' CHECK (multiproject IN ('yes', 'no')),
                    header_type TEXT,
                    md TEXT,
                    html TEXT,
                    isbase INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT
                )
            `)

            // Migrate data
            await db.exec(`
                INSERT INTO instructors (
                    xmlid, name, email, phone, city, country_id, cimg, description,
                    event_xmlid, version_id, status_id, multiproject, header_type, md, html, isbase,
                    created_at, updated_at
                )
                SELECT 
                    i.id,
                    i.name,
                    i.email,
                    i.phone,
                    i.city,
                    i.country_id,
                    i.cimg,
                    i.description,
                    i.event_id,
                    i.version_id,
                    (SELECT s.id FROM status s WHERE s.name = 'active' AND s."table" = 'persons' LIMIT 1),
                    i.multiproject,
                    i.header_type,
                    i.md,
                    i.html,
                    i.isbase,
                    i.created_at,
                    i.updated_at
                FROM instructors_old i
            `)

            // Drop FK constraints that reference instructors_old before dropping the table
            await db.exec(`ALTER TABLE events DROP CONSTRAINT IF EXISTS events_public_user_fkey`)
            await db.exec(`ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_public_user_fkey`)
            await db.exec(`ALTER TABLE event_instructors DROP CONSTRAINT IF EXISTS event_instructors_instructor_id_fkey`)
            await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_instructor_id_fkey`)
            await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_instructor_id_fkey1`)

            // Drop old table
            await db.exec(`DROP TABLE instructors_old`)
            console.log('    ✓ Instructors migrated to auto-ID with status_id')

            // Convert column types to INTEGER before recreating FK constraints
            await db.exec(`
                ALTER TABLE events 
                ALTER COLUMN public_user TYPE INTEGER 
                USING CASE 
                    WHEN public_user IS NULL THEN NULL
                    WHEN public_user ~ '^[0-9]+$' THEN public_user::INTEGER
                    ELSE NULL
                END
            `)
            await db.exec(`
                ALTER TABLE posts 
                ALTER COLUMN public_user TYPE INTEGER 
                USING CASE 
                    WHEN public_user IS NULL THEN NULL
                    WHEN public_user ~ '^[0-9]+$' THEN public_user::INTEGER
                    ELSE NULL
                END
            `)
            await db.exec(`
                ALTER TABLE event_instructors 
                ALTER COLUMN instructor_id TYPE INTEGER 
                USING CASE 
                    WHEN instructor_id IS NULL THEN NULL
                    WHEN instructor_id ~ '^[0-9]+$' THEN instructor_id::INTEGER
                    ELSE NULL
                END
            `)
            await db.exec(`
                ALTER TABLE users 
                ALTER COLUMN instructor_id TYPE INTEGER 
                USING CASE 
                    WHEN instructor_id IS NULL THEN NULL
                    WHEN instructor_id ~ '^[0-9]+$' THEN instructor_id::INTEGER
                    ELSE NULL
                END
            `)

            // Recreate FK constraints pointing to new instructors table
            await db.exec(`
                ALTER TABLE events 
                ADD CONSTRAINT events_public_user_fkey 
                FOREIGN KEY (public_user) REFERENCES instructors(id) ON DELETE SET NULL
            `)
            await db.exec(`
                ALTER TABLE posts 
                ADD CONSTRAINT posts_public_user_fkey 
                FOREIGN KEY (public_user) REFERENCES instructors(id) ON DELETE SET NULL
            `)
            await db.exec(`
                ALTER TABLE event_instructors 
                ADD CONSTRAINT event_instructors_instructor_id_fkey 
                FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
            `)
            await db.exec(`
                ALTER TABLE users 
                ADD CONSTRAINT users_instructor_id_fkey 
                FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
            `)

            // -------------------------------------------------------------------
            // 3.3: Migrate locations table
            // -------------------------------------------------------------------
            console.log('\n  📍 Migrating locations table...')

            // Backup existing table
            await db.exec(`ALTER TABLE locations RENAME TO locations_old`)

            // Create new table with auto-incrementing ID
            await db.exec(`
                CREATE TABLE locations (
                    id SERIAL PRIMARY KEY,
                    xmlid TEXT UNIQUE,
                    name TEXT NOT NULL,
                    phone TEXT,
                    email TEXT,
                    city TEXT,
                    zip TEXT,
                    street TEXT,
                    country_id TEXT,
                    is_company TEXT,
                    category_id TEXT,
                    cimg TEXT,
                    header_type TEXT,
                    header_size TEXT,
                    md TEXT,
                    is_location_provider TEXT,
                    event_xmlid TEXT,
                    version_id TEXT,
                    status_id INTEGER REFERENCES status(id),
                    project_id TEXT,
                    isbase INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT
                )
            `)

            // Migrate data (note: locations use 'persons' filter for status too)
            await db.exec(`
                INSERT INTO locations (
                    xmlid, name, phone, email, city, zip, street, country_id,
                    is_company, category_id, cimg, header_type, header_size, md,
                    is_location_provider, event_xmlid, version_id, status_id, project_id, isbase,
                    created_at, updated_at
                )
                SELECT 
                    l.id,
                    l.name,
                    l.phone,
                    l.email,
                    l.city,
                    l.zip,
                    l.street,
                    l.country_id,
                    l.is_company,
                    l.category_id,
                    l.cimg,
                    l.header_type,
                    l.header_size,
                    l.md,
                    l.is_location_provider,
                    l.event_id,
                    l.version_id,
                    (SELECT s.id FROM status s WHERE s.name = 'active' AND s."table" = 'persons' LIMIT 1),
                    l.project_id,
                    l.isbase,
                    l.created_at,
                    l.updated_at
                FROM locations_old l
            `)

            // Drop FK constraints that reference locations_old
            await db.exec(`ALTER TABLE events DROP CONSTRAINT IF EXISTS events_location_fkey`)

            // Drop old table
            await db.exec(`DROP TABLE locations_old`)

            // Convert column types to INTEGER (after dropping old table, before recreating FK)
            await db.exec(`
                ALTER TABLE events 
                ALTER COLUMN location TYPE INTEGER 
                USING CASE 
                    WHEN location IS NULL THEN NULL
                    WHEN location ~ '^[0-9]+$' THEN location::INTEGER
                    ELSE NULL
                END
            `)

            // Recreate FK constraint
            await db.exec(`
                ALTER TABLE events 
                ADD CONSTRAINT events_location_fkey 
                FOREIGN KEY (location) REFERENCES locations(id) ON DELETE SET NULL
            `)

            console.log('    ✓ Locations migrated to auto-ID with status_id')

            // -------------------------------------------------------------------
            // 3.4: Update foreign key references
            // -------------------------------------------------------------------
            // NOTE: FK reference updates are no longer needed here because:
            // 1. Data migration in steps 3.1-3.3 already populated new INTEGER ids
            // 2. Column type conversions above already converted FK columns to INTEGER
            // 3. FK constraints recreated above already reference the new INTEGER ids
            console.log('\n  🔗 Foreign key references already updated during migration')

            // -------------------------------------------------------------------
            // 3.5: Migrate events status from TEXT to INTEGER FK
            // -------------------------------------------------------------------
            console.log('\n  📊 Migrating events.status from TEXT to status_id INTEGER...')

            // Add new status_id column
            await db.exec(`
                ALTER TABLE events
                ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES status(id)
            `)

            // Map old TEXT status values to new INTEGER status IDs
            const eventsStatusMapping = [
                { oldValue: 'draft', newName: 'draft' },
                { oldValue: 'publish', newName: 'publish' },
                { oldValue: 'released', newName: 'released' },
                { oldValue: 'confirmed', newName: 'confirmed' },
                { oldValue: 'running', newName: 'running' },
                { oldValue: 'passed', newName: 'passed' },
                { oldValue: 'documented', newName: 'documented' }
            ]

            for (const mapping of eventsStatusMapping) {
                await db.exec(`
                    UPDATE events
                    SET status_id = (SELECT id FROM status WHERE "table" = 'events' AND name = '${mapping.newName}' LIMIT 1)
                    WHERE status = '${mapping.oldValue}'
                `)
            }

            // Set default for any unmapped statuses (use 'draft' as default)
            const defaultEventsStatusId = await db.get(`
                SELECT id FROM status WHERE "table" = 'events' AND name = 'draft' LIMIT 1
            `, [])

            await db.exec(`
                UPDATE events
                SET status_id = ${defaultEventsStatusId.id}
                WHERE status_id IS NULL
            `)

            console.log('    ✓ Migrated events.status to status_id')

            // -------------------------------------------------------------------
            // 3.6: Migrate posts status from TEXT to INTEGER FK
            // -------------------------------------------------------------------
            console.log('\n  📊 Migrating posts.status from TEXT to status_id INTEGER...')

            // Add new status_id column
            await db.exec(`
                ALTER TABLE posts
                ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES status(id)
            `)

            // Map old TEXT status values to new INTEGER status IDs
            const postsStatusMapping = [
                { oldValue: 'draft', newName: 'draft' },
                { oldValue: 'publish', newName: 'publish' },
                { oldValue: 'released', newName: 'released' }
            ]

            for (const mapping of postsStatusMapping) {
                await db.exec(`
                    UPDATE posts
                    SET status_id = (SELECT id FROM status WHERE "table" = 'posts' AND name = '${mapping.newName}' LIMIT 1)
                    WHERE status = '${mapping.oldValue}'
                `)
            }

            // Set default for any unmapped statuses (use 'draft' as default)
            const defaultPostsStatusId = await db.get(`
                SELECT id FROM status WHERE "table" = 'posts' AND name = 'draft' LIMIT 1
            `, [])

            await db.exec(`
                UPDATE posts
                SET status_id = ${defaultPostsStatusId.id}
                WHERE status_id IS NULL
            `)

            console.log('    ✓ Migrated posts.status to status_id')

            // ===================================================================
            // CHAPTER 3B: Migrate Events and Posts to Auto-Increment IDs
            // ===================================================================
            console.log('\n📖 Chapter 3B: Migrate Events and Posts to Auto-Increment IDs')

            // -------------------------------------------------------------------
            // 3B.1: Migrate events table to auto-increment ID
            // -------------------------------------------------------------------
            console.log('\n  📅 Migrating events table to auto-increment ID...')

            // Get all columns from events_old table dynamically
            const eventsColumns = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'events'
                ORDER BY ordinal_position
            `)
            const eventColumnNames = (eventsColumns as any[]).map(c => c.column_name)
            console.log(`    ℹ️  Found ${eventColumnNames.length} columns in events table: ${eventColumnNames.join(', ')}`)

            // Backup existing table
            await db.exec(`ALTER TABLE events RENAME TO events_old`)

            // Create new table with auto-incrementing ID and all existing columns except id
            // We keep all fields that exist, adding xmlid for the old id
            await db.exec(`
                CREATE TABLE events (
                    id SERIAL PRIMARY KEY,
                    xmlid TEXT UNIQUE,
                    name TEXT,
                    date_begin TEXT,
                    date_end TEXT,
                    address_id TEXT,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    seats_max INTEGER,
                    cimg TEXT,
                    header_type TEXT,
                    rectitle TEXT,
                    teaser TEXT,
                    version_id TEXT,
                    created_at TIMESTAMP,
                    updated_at TEXT,
                    status TEXT,
                    isbase INTEGER DEFAULT 0,
                    project TEXT,
                    template TEXT,
                    public_user INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
                    location INTEGER REFERENCES locations(id) ON DELETE SET NULL,
                    event_type TEXT,
                    md TEXT,
                    html TEXT,
                    status_id INTEGER REFERENCES status(id),
                    lang TEXT DEFAULT 'de' CHECK (lang IN ('de', 'en', 'cz')),
                    tags_ids INTEGER[] DEFAULT '{}',
                    tags_display TEXT[] DEFAULT '{}'
                )
            `)

            // Migrate data - dynamically build INSERT based on what columns exist
            // Note: user_id needs special handling as it's INTEGER in new table but may be TEXT in old
            const selectColumnsList = eventColumnNames.filter(col => col !== 'id' && col !== 'user_id')
            const selectClause = selectColumnsList.join(', ')

            await db.exec(`
                INSERT INTO events (
                    xmlid, ${selectClause}, user_id
                )
                SELECT 
                    id as xmlid, ${selectClause},
                    CASE 
                        WHEN user_id IS NULL THEN NULL
                        WHEN user_id ~ '^[0-9]+$' THEN user_id::INTEGER
                        ELSE NULL
                    END as user_id
                FROM events_old
            `)

            console.log('    ✓ Events migrated to auto-ID')

            // Drop any triggers or constraints on events_old before dropping the table
            await db.exec(`DROP TRIGGER IF EXISTS trigger_create_event_task ON events_old CASCADE`)
            await db.exec(`DROP TRIGGER IF EXISTS trigger_delete_event_task ON events_old CASCADE`)

            // Drop old table with CASCADE to handle any remaining dependencies
            await db.exec(`DROP TABLE events_old CASCADE`)

            console.log('    ✓ Dropped old events table')

            // -------------------------------------------------------------------
            // 3B.2: Update events_tags junction table
            // -------------------------------------------------------------------
            console.log('\n  🔗 Updating events_tags junction table...')

            // Create mapping of old TEXT ids to new INTEGER ids
            const eventIdMapping: Record<string, number> = {}
            const eventsData = await db.all('SELECT id, xmlid FROM events')

            for (const event of eventsData as any[]) {
                eventIdMapping[event.xmlid] = event.id
            }

            // Check if events_tags exists
            const eventsTagsExists = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'events_tags'
                )
            `)

            if ((eventsTagsExists as any).exists) {
                // Backup events_tags
                await db.exec(`ALTER TABLE events_tags RENAME TO events_tags_old`)

                // Create new junction table with INTEGER event_id
                await db.exec(`
                    CREATE TABLE events_tags (
                        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (event_id, tag_id)
                    )
                `)

                // Migrate data using the mapping
                const oldEventsTags = await db.all('SELECT * FROM events_tags_old')
                for (const oldTag of oldEventsTags as any[]) {
                    const newEventId = eventIdMapping[oldTag.event_id]
                    if (newEventId) {
                        await db.run(
                            `INSERT INTO events_tags (event_id, tag_id, created_at) VALUES ($1, $2, $3)`,
                            [newEventId, oldTag.tag_id, oldTag.created_at]
                        )
                    }
                }

                // Drop old table
                await db.exec(`DROP TABLE events_tags_old`)

                // Create indexes
                await db.exec(`
                    CREATE INDEX IF NOT EXISTS idx_events_tags_event ON events_tags(event_id)
                `)
                await db.exec(`
                    CREATE INDEX IF NOT EXISTS idx_events_tags_tag ON events_tags(tag_id)
                `)

                console.log('    ✓ events_tags junction table updated')
            } else {
                console.log('    ℹ️  events_tags table does not exist yet, will be created later')
            }

            // -------------------------------------------------------------------
            // 3B.3: Migrate posts table to auto-increment ID
            // -------------------------------------------------------------------
            console.log('\n  📝 Migrating posts table to auto-increment ID...')

            // Get all columns from posts table dynamically
            const postsColumns = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'posts'
                ORDER BY ordinal_position
            `)
            const postColumnNames = (postsColumns as any[]).map(c => c.column_name)
            console.log(`    ℹ️  Found ${postColumnNames.length} columns in posts table: ${postColumnNames.join(', ')}`)

            // Backup existing table
            await db.exec(`ALTER TABLE posts RENAME TO posts_old`)

            // Create new table with auto-incrementing ID and all existing columns except id
            await db.exec(`
                CREATE TABLE posts (
                    id SERIAL PRIMARY KEY,
                    xmlid TEXT UNIQUE,
                    name TEXT,
                    subtitle TEXT,
                    teaser TEXT,
                    author_id TEXT,
                    blog_id TEXT,
                    tag_ids TEXT,
                    website_published TEXT,
                    is_published TEXT,
                    post_date TEXT,
                    cover_properties TEXT,
                    event_xmlid TEXT,
                    cimg TEXT,
                    version_id TEXT,
                    created_at TIMESTAMP,
                    updated_at TEXT,
                    status TEXT,
                    isbase INTEGER DEFAULT 0,
                    project TEXT,
                    template TEXT,
                    public_user INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
                    header_type TEXT,
                    md TEXT,
                    html TEXT,
                    status_id INTEGER REFERENCES status(id),
                    lang TEXT DEFAULT 'de' CHECK (lang IN ('de', 'en', 'cz')),
                    tags_ids INTEGER[] DEFAULT '{}',
                    tags_display TEXT[] DEFAULT '{}'
                )
            `)

            // Migrate data - manually specify columns to handle event_id -> event_xmlid rename
            // Note: lang, tags_ids, tags_display are new columns with defaults
            await db.exec(`
                INSERT INTO posts (
                    xmlid, name, subtitle, teaser, author_id, blog_id, tag_ids, 
                    website_published, is_published, post_date, cover_properties, 
                    event_xmlid, cimg, version_id, created_at, updated_at, status, 
                    isbase, project, template, public_user, header_type, md, html, 
                    status_id
                )
                SELECT 
                    id as xmlid, name, subtitle, teaser, author_id, blog_id, tag_ids,
                    website_published, is_published, post_date, cover_properties,
                    event_id as event_xmlid, cimg, version_id, created_at, updated_at, status,
                    isbase, project, template, public_user, header_type, md, html,
                    status_id
                FROM posts_old
            `)

            console.log('    ✓ Posts migrated to auto-ID')

            // Drop any triggers or constraints on posts_old before dropping the table
            await db.exec(`DROP TRIGGER IF EXISTS trigger_create_post_task ON posts_old CASCADE`)
            await db.exec(`DROP TRIGGER IF EXISTS trigger_delete_post_task ON posts_old CASCADE`)

            // Drop old table with CASCADE to handle any remaining dependencies
            await db.exec(`DROP TABLE posts_old CASCADE`)

            console.log('    ✓ Dropped old posts table')

            // -------------------------------------------------------------------
            // 3B.4: Update posts_tags junction table
            // -------------------------------------------------------------------
            console.log('\n  🔗 Updating posts_tags junction table...')

            // Create mapping of old TEXT ids to new INTEGER ids
            const postIdMapping: Record<string, number> = {}
            const postsData = await db.all('SELECT id, xmlid FROM posts')

            for (const post of postsData as any[]) {
                postIdMapping[post.xmlid] = post.id
            }

            // Check if posts_tags exists
            const postsTagsExists = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'posts_tags'
                )
            `)

            if ((postsTagsExists as any).exists) {
                // Backup posts_tags
                await db.exec(`ALTER TABLE posts_tags RENAME TO posts_tags_old`)

                // Create new junction table with INTEGER post_id
                await db.exec(`
                    CREATE TABLE posts_tags (
                        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (post_id, tag_id)
                    )
                `)

                // Migrate data using the mapping
                const oldPostsTags = await db.all('SELECT * FROM posts_tags_old')
                for (const oldTag of oldPostsTags as any[]) {
                    const newPostId = postIdMapping[oldTag.post_id]
                    if (newPostId) {
                        await db.run(
                            `INSERT INTO posts_tags (post_id, tag_id, created_at) VALUES ($1, $2, $3)`,
                            [newPostId, oldTag.tag_id, oldTag.created_at]
                        )
                    }
                }

                // Drop old table
                await db.exec(`DROP TABLE posts_tags_old`)

                // Create indexes
                await db.exec(`
                    CREATE INDEX IF NOT EXISTS idx_posts_tags_post ON posts_tags(post_id)
                `)
                await db.exec(`
                    CREATE INDEX IF NOT EXISTS idx_posts_tags_tag ON posts_tags(tag_id)
                `)

                console.log('    ✓ posts_tags junction table updated')
            } else {
                console.log('    ℹ️  posts_tags table does not exist yet, will be created later')
            }

            // -------------------------------------------------------------------
            // 3B.5: Update event_instructors.event_id to INTEGER
            // -------------------------------------------------------------------
            console.log('\n  🔗 Updating event_instructors.event_id to INTEGER...')

            // Drop foreign key constraint if it exists (will be recreated later in migration 021)
            await db.exec(`ALTER TABLE event_instructors DROP CONSTRAINT IF EXISTS event_instructors_event_id_fkey`)

            // Convert event_id from TEXT to INTEGER using the mapping
            // First, create backup
            await db.exec(`ALTER TABLE event_instructors RENAME TO event_instructors_old`)

            // Create new table with INTEGER event_id
            await db.exec(`
                CREATE TABLE event_instructors (
                    event_id INTEGER NOT NULL,
                    instructor_id INTEGER NOT NULL,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (event_id, instructor_id)
                )
            `)

            // Migrate data using the event ID mapping
            const oldEventInstructors = await db.all('SELECT * FROM event_instructors_old')
            let migratedCount = 0
            for (const oldRel of oldEventInstructors as any[]) {
                const newEventId = eventIdMapping[oldRel.event_id]
                if (newEventId) {
                    await db.run(
                        `INSERT INTO event_instructors (event_id, instructor_id, added_at) VALUES ($1, $2, $3)
                         ON CONFLICT (event_id, instructor_id) DO NOTHING`,
                        [newEventId, oldRel.instructor_id, oldRel.added_at]
                    )
                    migratedCount++
                } else {
                    console.log(`    ⚠️  Skipping event_instructor with invalid event_id: ${oldRel.event_id}`)
                }
            }

            // Drop old table
            await db.exec(`DROP TABLE event_instructors_old`)

            // Create indexes
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_event_instructors_event ON event_instructors(event_id)`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_event_instructors_instructor ON event_instructors(instructor_id)`)

            console.log(`    ✓ event_instructors.event_id converted to INTEGER (${migratedCount} relationships migrated)`)

            // -------------------------------------------------------------------
            // 3B.6: Note about project field conversion
            // -------------------------------------------------------------------
            console.log('\n  ℹ️  Note: events.project and posts.project remain as TEXT (domaincode)')
            console.log('      These will be converted to project_id INTEGER in Chapter 5B after projects migration')

            console.log('\n✅ Chapter 3B completed: Events and Posts migrated to auto-increment IDs')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: File table migration requires manual handling')

            // Similar pattern for SQLite would go here
            // For now, just log a warning
            console.log('    ⚠️  SQLite migration for file tables not yet implemented')
        }

        // ===================================================================
        // CHAPTER 4: Integrate Users, Participants and Instructors
        // ===================================================================
        console.log('\n📖 Chapter 4: Integrate Users, Participants and Instructors')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 4.1: Add participant_id to users table
            // -------------------------------------------------------------------
            console.log('\n  👤 Adding participant_id to users table...')

            await db.exec(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS participant_id INTEGER REFERENCES participants(id)
            `)
            console.log('    ✓ Added users.participant_id linking to participants table')

            // -------------------------------------------------------------------
            // 4.2: Update users.instructor_id to reference new auto-increment IDs
            // -------------------------------------------------------------------
            console.log('\n  🎓 Updating users.instructor_id to reference new instructor IDs...')

            // Check if any users have instructor_id set
            const usersWithInstructors = await db.all(`
                SELECT id, instructor_id 
                FROM users 
                WHERE instructor_id IS NOT NULL
            `, [])

            if (usersWithInstructors.length > 0) {
                console.log(`    → Found ${usersWithInstructors.length} users with instructor references`)

                // Drop existing foreign key constraint
                await db.exec(`
                    ALTER TABLE users 
                    DROP CONSTRAINT IF EXISTS users_instructor_id_fkey
                `)

                // Update instructor_id values to use new integer IDs
                for (const user of usersWithInstructors) {
                    const instructor = await db.get(`
                        SELECT id FROM instructors WHERE xmlid = $1
                    `, [user.instructor_id])

                    if (instructor) {
                        await db.run(`
                            UPDATE users 
                            SET instructor_id = $1 
                            WHERE id = $2
                        `, [instructor.id.toString(), user.id])
                    }
                }

                // Recreate foreign key constraint with INTEGER type
                // First, we need to alter the column type
                await db.exec(`
                    ALTER TABLE users 
                    ALTER COLUMN instructor_id TYPE INTEGER USING instructor_id::INTEGER
                `)

                await db.exec(`
                    ALTER TABLE users 
                    ADD CONSTRAINT users_instructor_id_fkey 
                    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
                `)

                console.log('    ✓ Updated users.instructor_id to reference new instructor IDs')
            } else {
                console.log('    ℹ️  No users with instructor_id found, updating column type only')

                // Just update the column type
                await db.exec(`
                    ALTER TABLE users 
                    DROP CONSTRAINT IF EXISTS users_instructor_id_fkey
                `)

                await db.exec(`
                    ALTER TABLE users 
                    ALTER COLUMN instructor_id TYPE INTEGER USING instructor_id::INTEGER
                `)

                await db.exec(`
                    ALTER TABLE users 
                    ADD CONSTRAINT users_instructor_id_fkey 
                    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
                `)
            }

            // -------------------------------------------------------------------
            // 4.3: Add computed column is_user to participants
            // -------------------------------------------------------------------
            console.log('\n  👥 Adding computed column is_user to participants...')

            // Add as regular column (PostgreSQL doesn't support subqueries in generated columns)
            await db.exec(`
                ALTER TABLE participants 
                ADD COLUMN IF NOT EXISTS is_user BOOLEAN DEFAULT FALSE
            `)

            // Create trigger function to maintain is_user
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_participant_is_user()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
                        IF NEW.participant_id IS NOT NULL THEN
                            UPDATE participants 
                            SET is_user = TRUE 
                            WHERE id = NEW.participant_id;
                        END IF;
                        RETURN NEW;
                    ELSIF (TG_OP = 'DELETE') THEN
                        IF OLD.participant_id IS NOT NULL THEN
                            UPDATE participants 
                            SET is_user = (
                                EXISTS (
                                    SELECT 1 FROM users 
                                    WHERE participant_id = OLD.participant_id
                                    AND id != OLD.id
                                )
                            )
                            WHERE id = OLD.participant_id;
                        END IF;
                        RETURN OLD;
                    END IF;
                    RETURN NULL;
                END;
                $$ LANGUAGE plpgsql
            `)

            // Create trigger on users table
            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_participant_is_user ON users
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_participant_is_user
                AFTER INSERT OR UPDATE OR DELETE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_participant_is_user()
            `)

            // Initial population
            await db.exec(`
                UPDATE participants p
                SET is_user = EXISTS (
                    SELECT 1 FROM users WHERE participant_id = p.id
                )
            `)

            console.log('    ✓ Added participants.is_user with trigger maintenance')

            // -------------------------------------------------------------------
            // 4.4: Add computed column is_user to instructors
            // -------------------------------------------------------------------
            console.log('\n  🎓 Adding computed column is_user to instructors...')

            // Add as regular column (PostgreSQL doesn't support subqueries in generated columns)
            await db.exec(`
                ALTER TABLE instructors 
                ADD COLUMN IF NOT EXISTS is_user BOOLEAN DEFAULT FALSE
            `)

            // Create trigger function to maintain is_user
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_instructor_is_user()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
                        IF NEW.instructor_id IS NOT NULL THEN
                            UPDATE instructors 
                            SET is_user = TRUE 
                            WHERE id = NEW.instructor_id;
                        END IF;
                        RETURN NEW;
                    ELSIF (TG_OP = 'DELETE') THEN
                        IF OLD.instructor_id IS NOT NULL THEN
                            UPDATE instructors 
                            SET is_user = (
                                EXISTS (
                                    SELECT 1 FROM users 
                                    WHERE instructor_id = OLD.instructor_id
                                    AND id != OLD.id
                                )
                            )
                            WHERE id = OLD.instructor_id;
                        END IF;
                        RETURN OLD;
                    END IF;
                    RETURN NULL;
                END;
                $$ LANGUAGE plpgsql
            `)

            // Create trigger on users table
            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_instructor_is_user ON users
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_instructor_is_user
                AFTER INSERT OR UPDATE OR DELETE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_instructor_is_user()
            `)

            // Initial population
            await db.exec(`
                UPDATE instructors i
                SET is_user = EXISTS (
                    SELECT 1 FROM users WHERE instructor_id = i.id
                )
            `)

            console.log('    ✓ Added instructors.is_user with trigger maintenance')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: User integration requires manual handling')
            console.log('    ⚠️  SQLite does not support computed columns in ALTER TABLE')
        }

        // ===================================================================
        // CHAPTER 5: Align Projects, Add Auto-ID
        // ===================================================================
        console.log('\n📖 Chapter 5: Align Projects, Add Auto-ID')
        console.log('  ℹ️  Migrating projects table to auto-increment ID')
        console.log('  ℹ️  Renaming id → domaincode, heading → name')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 5.1: Add header_size field
            // -------------------------------------------------------------------
            console.log('\n  📐 Adding header_size field to projects...')

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS header_size TEXT 
                CHECK (header_size IN ('small', 'medium', 'large'))
            `)
            console.log('    ✓ Added projects.header_size field')

            // -------------------------------------------------------------------
            // 5.2: Backup and recreate projects table
            // -------------------------------------------------------------------
            console.log('\n  📦 Migrating projects table structure...')

            // Backup existing table
            await db.exec(`ALTER TABLE projects RENAME TO projects_old`)

            // Create new projects table with auto-incrementing id
            await db.exec(`
                CREATE TABLE projects (
                    id SERIAL PRIMARY KEY,
                    domaincode TEXT UNIQUE NOT NULL CHECK (domaincode ~ '^[a-z][a-z0-9_]*$'),
                    name TEXT,
                    description TEXT,
                    status_old TEXT DEFAULT 'new',
                    owner_id INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT,
                    header_type TEXT,
                    header_size TEXT CHECK (header_size IN ('small', 'medium', 'large')),
                    md TEXT,
                    html TEXT,
                    type TEXT DEFAULT 'project' CHECK (type IN ('project', 'regio', 'special', 'topic', 'location')),
                    is_regio BOOLEAN GENERATED ALWAYS AS (type = 'regio') STORED,
                    is_topic BOOLEAN GENERATED ALWAYS AS (type = 'topic') STORED,
                    is_onepage BOOLEAN GENERATED ALWAYS AS (COALESCE((config->>'onepage')::BOOLEAN, FALSE)) STORED,
                    is_service BOOLEAN GENERATED ALWAYS AS (COALESCE((config->>'service')::BOOLEAN, FALSE)) STORED,
                    is_sidebar BOOLEAN GENERATED ALWAYS AS (COALESCE((config->>'sidebar')::BOOLEAN, FALSE)) STORED,
                    regio INTEGER REFERENCES projects(id),
                    partner_projects TEXT,
                    heading TEXT,
                    theme INTEGER,
                    cimg TEXT,
                    teaser TEXT,
                    team_page TEXT DEFAULT 'yes' CHECK (team_page IN ('yes', 'no')),
                    cta_title TEXT,
                    cta_form TEXT,
                    cta_entity TEXT CHECK (cta_entity IN ('post', 'event', 'instructor')),
                    cta_link TEXT,
                    is_company BOOLEAN DEFAULT FALSE,
                    is_location_provider BOOLEAN DEFAULT FALSE,
                    config JSONB,
                    domain_id INTEGER REFERENCES domains(id),
                    member_ids JSONB
                )
            `)

            // Migrate data: domaincode from old id, name from old heading
            await db.exec(`
                INSERT INTO projects (
                    domaincode, name, description, status_old, owner_id, created_at, updated_at,
                    header_type, header_size, md, html, type, regio, partner_projects,
                    heading, theme, cimg, teaser, team_page, cta_title, cta_form,
                    cta_entity, cta_link, is_company, config, domain_id, member_ids
                )
                SELECT 
                    p.id,  -- old id becomes domaincode
                    p.heading,  -- old heading becomes name
                    p.description,
                    p.status_old,
                    p.owner_id,  -- Already converted to INTEGER in Chapter 2
                    p.created_at,
                    p.updated_at,
                    p.header_type,
                    NULL,  -- header_size (new field, defaults to NULL)
                    p.md,
                    p.html,
                    p.type,
                    NULL,  -- regio will be updated in next step
                    p.partner_projects,
                    p.heading,  -- Keep original heading field too
                    p.theme,
                    p.cimg,
                    p.teaser,
                    p.team_page,
                    p.cta_title,
                    p.cta_form,
                    p.cta_entity,
                    p.cta_link,
                    p.is_company,
                    p.config,
                    p.domain_id,
                    p.member_ids
                FROM projects_old p
            `)

            // Update regio references (self-referential FK)
            await db.exec(`
                UPDATE projects p
                SET regio = (
                    SELECT p2.id 
                    FROM projects p2 
                    JOIN projects_old po ON po.id = p.domaincode
                    WHERE p2.domaincode = po.regio
                    LIMIT 1
                )
                WHERE EXISTS (
                    SELECT 1 FROM projects_old po 
                    WHERE po.id = p.domaincode AND po.regio IS NOT NULL
                )
            `)

            console.log('    ✓ Projects table migrated with new ID structure')

            // -------------------------------------------------------------------
            // 5.3: Update foreign key references in other tables
            // -------------------------------------------------------------------
            console.log('\n  🔗 Updating foreign key references to projects...')

            // Create temporary mapping table
            await db.exec(`
                CREATE TEMPORARY TABLE project_id_map AS
                SELECT domaincode AS old_id, id AS new_id
                FROM projects
            `)

            // Update events.project
            const eventsProjectCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'project'
            `, [])

            if (eventsProjectCol.length > 0) {
                console.log('    → Updating events.project references...')
                await db.exec(`
                    UPDATE events e
                    SET project = m.new_id::TEXT
                    FROM project_id_map m
                    WHERE e.project = m.old_id
                `)
                console.log('    ✓ Updated events.project')
            }

            // Update posts.project
            const postsProjectCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'project'
            `, [])

            if (postsProjectCol.length > 0) {
                console.log('    → Updating posts.project references...')
                await db.exec(`
                    UPDATE posts p
                    SET project = m.new_id::TEXT
                    FROM project_id_map m
                    WHERE p.project = m.old_id
                `)
                console.log('    ✓ Updated posts.project')
            }

            // Update locations.project_id
            const locationsProjectCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'locations' AND column_name = 'project_id'
            `, [])

            if (locationsProjectCol.length > 0) {
                console.log('    → Updating locations.project_id references...')
                await db.exec(`
                    UPDATE locations l
                    SET project_id = m.new_id::TEXT
                    FROM project_id_map m
                    WHERE l.project_id = m.old_id
                `)
                console.log('    ✓ Updated locations.project_id')
            }

            // Update project_members.project_id
            const projectMembersTable = await db.all(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'project_members'
            `, [])

            if (projectMembersTable.length > 0) {
                console.log('    → Updating project_members.project_id references...')
                await db.exec(`
                    ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_project_id_fkey
                `)
                // Use UPDATE to convert domaincode to integer id
                await db.exec(`
                    UPDATE project_members pm
                    SET project_id = m.new_id::TEXT
                    FROM project_id_map m
                    WHERE pm.project_id = m.old_id
                `)
                // Convert column type to INTEGER
                await db.exec(`
                    ALTER TABLE project_members 
                    ALTER COLUMN project_id TYPE INTEGER 
                    USING CASE 
                        WHEN project_id IS NULL THEN NULL
                        WHEN project_id ~ '^[0-9]+$' THEN project_id::INTEGER
                        ELSE NULL
                    END
                `)
                // Recreate FK constraint
                await db.exec(`
                    ALTER TABLE project_members 
                    ADD CONSTRAINT project_members_project_id_fkey 
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                `)
                console.log('    ✓ Updated project_members.project_id')
            }

            // Update domains.project_id if exists
            const domainsProjectCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'domains' AND column_name = 'project_id'
            `, [])

            if (domainsProjectCol.length > 0) {
                console.log('    → Updating domains.project_id references...')
                await db.exec(`
                    UPDATE domains d
                    SET project_id = m.new_id::TEXT
                    FROM project_id_map m
                    WHERE d.project_id = m.old_id
                `)
                console.log('    ✓ Updated domains.project_id')
            }

            // Drop temporary mapping table
            await db.exec(`DROP TABLE project_id_map`)

            // Drop FK constraints referencing projects_old before dropping table
            // Note: events and posts project fields are converted in Chapter 5B
            await db.exec(`ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_project_fkey`)
            await db.exec(`ALTER TABLE form_input DROP CONSTRAINT IF EXISTS form_input_project_fkey`)
            await db.exec(`ALTER TABLE domains DROP CONSTRAINT IF EXISTS domains_project_id_fkey`)
            await db.exec(`ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_project_id_fkey`)

            // Drop old projects table
            await db.exec(`DROP TABLE projects_old`)

            // Convert column types to INTEGER and recreate FK constraints
            // Note: events.project and posts.project are handled in Chapter 5B after this

            await db.exec(`
                ALTER TABLE pages 
                ALTER COLUMN project TYPE INTEGER 
                USING CASE 
                    WHEN project IS NULL THEN NULL
                    WHEN project ~ '^[0-9]+$' THEN project::INTEGER
                    ELSE NULL
                END
            `)
            await db.exec(`
                ALTER TABLE pages 
                ADD CONSTRAINT pages_project_fkey 
                FOREIGN KEY (project) REFERENCES projects(id) ON DELETE SET NULL
            `)

            await db.exec(`
                ALTER TABLE form_input 
                ALTER COLUMN project TYPE INTEGER 
                USING CASE 
                    WHEN project IS NULL THEN NULL
                    WHEN project ~ '^[0-9]+$' THEN project::INTEGER
                    ELSE NULL
                END
            `)
            await db.exec(`
                ALTER TABLE form_input 
                ADD CONSTRAINT form_input_project_fkey 
                FOREIGN KEY (project) REFERENCES projects(id) ON DELETE SET NULL
            `)

            await db.exec(`
                ALTER TABLE domains 
                ALTER COLUMN project_id TYPE INTEGER 
                USING CASE 
                    WHEN project_id IS NULL THEN NULL
                    WHEN project_id ~ '^[0-9]+$' THEN project_id::INTEGER
                    ELSE NULL
                END
            `)
            await db.exec(`
                ALTER TABLE domains 
                ADD CONSTRAINT domains_project_id_fkey 
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
            `)

            await db.exec(`
                ALTER TABLE locations 
                ALTER COLUMN project_id TYPE INTEGER 
                USING CASE 
                    WHEN project_id IS NULL THEN NULL
                    WHEN project_id ~ '^[0-9]+$' THEN project_id::INTEGER
                    ELSE NULL
                END
            `)
            await db.exec(`
                ALTER TABLE locations 
                ADD CONSTRAINT locations_project_id_fkey 
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
            `)

            console.log('    ✓ All foreign key references updated')

            // -------------------------------------------------------------------
            // 5.4: Create indexes
            // -------------------------------------------------------------------
            console.log('\n  📇 Creating indexes for projects...')

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_projects_domaincode ON projects(domaincode)
            `)
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id)
            `)
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type)
            `)
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_projects_status_old ON projects(status_old)
            `)

            console.log('    ✓ Indexes created')

            // -------------------------------------------------------------------
            // 5.5: Add is_location_provider field with trigger
            // -------------------------------------------------------------------
            console.log('\n  🏢 Setting up is_location_provider field...')

            // Create function to update is_location_provider
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_project_location_provider()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- When location is inserted or updated
                    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
                        -- Update project if location has status_id > 2
                        IF NEW.project_id IS NOT NULL AND NEW.status_id > 2 THEN
                            UPDATE projects 
                            SET is_location_provider = TRUE 
                            WHERE id = NEW.project_id;
                        END IF;
                        RETURN NEW;
                    END IF;

                    -- When location is deleted
                    IF (TG_OP = 'DELETE') THEN
                        -- Check if project still has other locations with status_id > 2
                        IF OLD.project_id IS NOT NULL THEN
                            UPDATE projects 
                            SET is_location_provider = (
                                EXISTS (
                                    SELECT 1 FROM locations 
                                    WHERE project_id = OLD.project_id 
                                    AND status_id > 2
                                    AND id != OLD.id
                                )
                            )
                            WHERE id = OLD.project_id;
                        END IF;
                        RETURN OLD;
                    END IF;

                    RETURN NULL;
                END;
                $$ LANGUAGE plpgsql;
            `)

            // Create trigger on locations table
            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_project_location_provider ON locations;
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_project_location_provider
                AFTER INSERT OR UPDATE OR DELETE ON locations
                FOR EACH ROW
                EXECUTE FUNCTION update_project_location_provider();
            `)

            // Initial population: set is_location_provider based on existing locations
            await db.exec(`
                UPDATE projects p
                SET is_location_provider = TRUE
                WHERE EXISTS (
                    SELECT 1 FROM locations l
                    WHERE l.project_id = p.id
                    AND l.status_id > 2
                );
            `)

            console.log('    ✓ is_location_provider field configured with trigger')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: Projects migration requires manual handling')
            console.log('    ⚠️  SQLite migration for projects not yet implemented')
        }

        // ===================================================================
        // CHAPTER 5B: Convert Events/Posts project to project_id
        // ===================================================================
        console.log('\n📖 Chapter 5B: Convert Events/Posts project to project_id')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 5B.1: Update events.project to events.project_id (INTEGER FK)
            // -------------------------------------------------------------------
            console.log('\n  🔄 Converting events.project to project_id...')

            // Check if project column exists and is TEXT
            const eventsProjectCol = await db.all(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'project'
            `)

            if (eventsProjectCol.length > 0) {
                console.log(`    ℹ️  events.project exists with type: ${(eventsProjectCol[0] as any).data_type}`)

                // Add new project_id column
                await db.exec(`
                    ALTER TABLE events
                    ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
                `)

                // Map TEXT domaincode to INTEGER project.id
                // Handle both TEXT and INTEGER cases
                const projectType = (eventsProjectCol[0] as any).data_type
                if (projectType === 'text' || projectType === 'character varying') {
                    await db.exec(`
                        UPDATE events e
                        SET project_id = p.id
                        FROM projects p
                        WHERE e.project = p.domaincode
                    `)
                } else if (projectType === 'integer') {
                    // Already INTEGER, just copy
                    await db.exec(`
                        UPDATE events e
                        SET project_id = project
                    `)
                }

                // Drop old project column
                await db.exec(`ALTER TABLE events DROP COLUMN IF EXISTS project`)

                console.log('    ✓ Converted events.project → events.project_id')
            } else {
                console.log('    ℹ️  events.project does not exist, project_id may already be set')
            }

            // -------------------------------------------------------------------
            // 5B.2: Update posts.project to posts.project_id (INTEGER FK)
            // -------------------------------------------------------------------
            console.log('\n  🔄 Converting posts.project to project_id...')

            // Check if project column exists and is TEXT
            const postsProjectCol = await db.all(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'project'
            `)

            if (postsProjectCol.length > 0) {
                console.log(`    ℹ️  posts.project exists with type: ${(postsProjectCol[0] as any).data_type}`)

                // Add new project_id column
                await db.exec(`
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
                `)

                // Map TEXT domaincode to INTEGER project.id
                const projectType = (postsProjectCol[0] as any).data_type
                if (projectType === 'text' || projectType === 'character varying') {
                    await db.exec(`
                        UPDATE posts p
                        SET project_id = pr.id
                        FROM projects pr
                        WHERE p.project = pr.domaincode
                    `)
                } else if (projectType === 'integer') {
                    // Already INTEGER, just copy
                    await db.exec(`
                        UPDATE posts p
                        SET project_id = project
                    `)
                }

                // Drop old project column
                await db.exec(`ALTER TABLE posts DROP COLUMN IF EXISTS project`)

                console.log('    ✓ Converted posts.project → posts.project_id')
            } else {
                console.log('    ℹ️  posts.project does not exist, project_id may already be set')
            }

            // -------------------------------------------------------------------
            // 5B.3: Add regio_id to events and posts (will be computed by triggers)
            // -------------------------------------------------------------------
            console.log('\n  🌍 Adding regio_id columns...')

            await db.exec(`
                ALTER TABLE events
                ADD COLUMN IF NOT EXISTS regio_id INTEGER REFERENCES projects(id)
            `)

            await db.exec(`
                ALTER TABLE posts
                ADD COLUMN IF NOT EXISTS regio_id INTEGER REFERENCES projects(id)
            `)

            // Populate initial values
            await db.exec(`
                UPDATE events e
                SET regio_id = p.regio
                FROM projects p
                WHERE e.project_id = p.id AND p.regio IS NOT NULL
            `)

            await db.exec(`
                UPDATE posts po
                SET regio_id = p.regio
                FROM projects p
                WHERE po.project_id = p.id AND p.regio IS NOT NULL
            `)

            console.log('    ✓ Added and populated regio_id columns')

            console.log('\n✅ Chapter 5B completed: Events and Posts project references converted to INTEGER FK')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: Events/Posts project conversion requires manual handling')
            console.log('    ⚠️  SQLite migration for events/posts not yet implemented')
        }

        // ===================================================================
        // CHAPTER 5B.4: Create Images Table with Custom Types
        // ===================================================================
        console.log('\n📖 Chapter 5B.4: Create Images Table with Custom Types')

        if (isPostgres) {
            // Create custom types for images system
            console.log('  Creating custom types for images system...')

            // Shape option type
            await db.exec(`
                DO $$ BEGIN
                    CREATE TYPE shape_opt_type AS ENUM ('param', 'json', 'url');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `)
            console.log('    ✓ Created shape_opt_type')

            // Image file type
            await db.exec(`
                DO $$ BEGIN
                    CREATE TYPE image_file_type AS ENUM ('none', 'jpeg', 'webp', 'avif', 'svg', 'gif', 'png');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `)
            console.log('    ✓ Created image_file_type')

            // Embed file type (video and audio formats)
            await db.exec(`
                DO $$ BEGIN
                    CREATE TYPE embed_file_type AS ENUM ('pptx', 'pdf', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `)
            console.log('    ✓ Created embed_file_type')

            // Media licence
            await db.exec(`
                DO $$ BEGIN
                    CREATE TYPE media_licence AS ENUM ('undefined', 'BY', 'BY-SA', 'BY-ND', 'BY-NC', 'BY-NC-SA', 'CC0', 'BY-ND-NC', 'BY-ND-NC-ND', 'unsplash', 'commercial', 'private');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `)
            console.log('    ✓ Created media_licence')

            // Media adapter type
            await db.exec(`
                DO $$ BEGIN
                    CREATE TYPE media_adapter_type AS ENUM ('unsplash', 'cloudinary', 'canva', 'msteams', 'vimeo', 'youtube', 'cloudflare', 'signal', 'instagram', 'obsidian', 'crearis', 'odoo', 'pruvious');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `)
            console.log('    ✓ Created media_adapter_type')

            // Media adapter composite type
            await db.exec(`
                DROP TYPE IF EXISTS media_adapter CASCADE;
                CREATE TYPE media_adapter AS (
                    adapter      media_adapter_type,
                    file_id      text,
                    account_id   text,
                    folder_id    text,
                    info         text,
                    config       jsonb
                );
            `)
            console.log('    ✓ Created media_adapter composite type')

            // Image shape composite type
            await db.exec(`
                DROP TYPE IF EXISTS image_shape CASCADE;
                CREATE TYPE image_shape AS (
                    x            numeric,
                    y            numeric,
                    z            numeric,
                    url          text,
                    json         jsonb,
                    blur         varchar(50),
                    turl         text,
                    tpar         text
                );
            `)
            console.log('    ✓ Created image_shape composite type')

            // Image variation composite type
            await db.exec(`
                DROP TYPE IF EXISTS image_variation CASCADE;
                CREATE TYPE image_variation AS (
                    parent_id    integer,
                    alike_ids    integer[],
                    release_id   integer,
                    info         text
                );
            `)
            console.log('    ✓ Created image_variation composite type')

            // Create images table
            console.log('  Creating images table...')
            await db.exec(`
                CREATE TABLE IF NOT EXISTS images (
                    id SERIAL PRIMARY KEY,
                    xmlid TEXT DEFAULT NULL,
                    name TEXT NOT NULL,
                    url TEXT NOT NULL,
                    project_id INTEGER DEFAULT NULL REFERENCES projects(id) ON DELETE SET NULL,
                    project_domaincode TEXT DEFAULT NULL,
                    status_id INTEGER DEFAULT 0,
                    owner_id INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
                    alt_text TEXT DEFAULT NULL,
                    title TEXT DEFAULT NULL,
                    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    geo JSONB DEFAULT NULL,
                    x INTEGER DEFAULT NULL,
                    y INTEGER DEFAULT NULL,
                    shape_wide image_shape DEFAULT NULL,
                    shape_square image_shape DEFAULT NULL,
                    shape_vertical image_shape DEFAULT NULL,
                    shape_thumb image_shape DEFAULT NULL,
                    fileformat image_file_type DEFAULT 'none',
                    embedformat embed_file_type DEFAULT NULL,
                    license media_licence DEFAULT 'BY',
                    length INTEGER DEFAULT NULL,
                    about TEXT DEFAULT NULL,
                    author media_adapter DEFAULT NULL,
                    producer media_adapter DEFAULT NULL,
                    publisher media_adapter DEFAULT NULL,
                    variations image_variation DEFAULT NULL,
                    root_id INTEGER DEFAULT NULL,
                    use_player BOOLEAN DEFAULT FALSE,
                    ctags BYTEA DEFAULT '\\x00',
                    is_public BOOLEAN DEFAULT FALSE,
                    is_private BOOLEAN DEFAULT FALSE,
                    is_internal BOOLEAN DEFAULT FALSE,
                    is_deprecated BOOLEAN DEFAULT FALSE,
                    has_issues BOOLEAN DEFAULT FALSE,
                    rtags BYTEA DEFAULT '\\x00',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `)
            console.log('    ✓ Created images table')

            // Create trigger function to compute computed fields
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_image_computed_fields()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Compute about field
                    IF (NEW.author).account_id IS NOT NULL THEN
                        NEW.about := '(c) ' || (NEW.author).account_id || ' via ' || (NEW.author).adapter::text;
                    ELSIF NEW.owner_id IS NOT NULL THEN
                        NEW.about := '(c) owner_id:' || NEW.owner_id::text;
                    ELSE
                        NEW.about := NULL;
                    END IF;
                    
                    -- Compute use_player
                    NEW.use_player := NEW.publisher IS NOT NULL AND 
                                     ((NEW.publisher).adapter = 'vimeo' OR (NEW.publisher).adapter = 'youtube');
                    
                    -- Compute is_public, is_private, is_internal from bits 4+5 of ctags
                    NEW.is_public := (get_byte(NEW.ctags, 0) & 48) = 16;
                    NEW.is_private := (get_byte(NEW.ctags, 0) & 48) = 32;
                    NEW.is_internal := (get_byte(NEW.ctags, 0) & 48) = 48;
                    
                    -- Compute is_deprecated, has_issues from bits 6+7 of ctags
                    NEW.is_deprecated := (get_byte(NEW.ctags, 0) & 192) = 64;
                    NEW.has_issues := (get_byte(NEW.ctags, 0) & 192) IN (128, 192);
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS trigger_update_image_computed_fields ON images;
                CREATE TRIGGER trigger_update_image_computed_fields
                BEFORE INSERT OR UPDATE ON images
                FOR EACH ROW
                EXECUTE FUNCTION update_image_computed_fields();
            `)
            console.log('    ✓ Created trigger for computed fields')

            // Create trigger function for root_id computation
            await db.exec(`
                CREATE OR REPLACE FUNCTION compute_image_root_id(img_id INTEGER, depth INTEGER DEFAULT 0) 
                RETURNS INTEGER AS $$
                DECLARE
                    parent INTEGER;
                    result INTEGER;
                BEGIN
                    -- Prevent infinite recursion
                    IF depth > 5 THEN
                        RAISE EXCEPTION 'Nesting too deep or endless loop detected for image_id=%', img_id;
                    END IF;

                    -- Get parent_id from variations
                    SELECT (variations).parent_id INTO parent
                    FROM images
                    WHERE id = img_id;

                    -- If no parent, this is the root
                    IF parent IS NULL THEN
                        RETURN NULL;
                    END IF;

                    -- Recursively find the root
                    SELECT compute_image_root_id(parent, depth + 1) INTO result;

                    -- If parent's root is NULL, parent is the root
                    IF result IS NULL THEN
                        RETURN parent;
                    ELSE
                        RETURN result;
                    END IF;
                END;
                $$ LANGUAGE plpgsql;
            `)
            console.log('    ✓ Created compute_image_root_id function')

            // Create trigger to auto-compute root_id
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_image_root_id() 
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.variations IS NOT NULL AND (NEW.variations).parent_id IS NOT NULL THEN
                        NEW.root_id := compute_image_root_id(NEW.id);
                    ELSE
                        NEW.root_id := NULL;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS trigger_update_image_root_id ON images;
                CREATE TRIGGER trigger_update_image_root_id
                BEFORE INSERT OR UPDATE ON images
                FOR EACH ROW
                EXECUTE FUNCTION update_image_root_id();
            `)
            console.log('    ✓ Created trigger for root_id computation')

            // Create trigger to auto-populate project_domaincode from project
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_image_project_domaincode()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.project_id IS NOT NULL THEN
                        SELECT domaincode INTO NEW.project_domaincode
                        FROM projects
                        WHERE id = NEW.project_id;
                    ELSE
                        NEW.project_domaincode := NULL;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS trigger_update_image_project_domaincode ON images;
                CREATE TRIGGER trigger_update_image_project_domaincode
                BEFORE INSERT OR UPDATE ON images
                FOR EACH ROW
                EXECUTE FUNCTION update_image_project_domaincode();
            `)
            console.log('    ✓ Created trigger for project_domaincode auto-population')

            // Create indexes
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id);
                CREATE INDEX IF NOT EXISTS idx_images_project_domaincode ON images(project_domaincode);
                CREATE INDEX IF NOT EXISTS idx_images_owner_id ON images(owner_id);
                CREATE INDEX IF NOT EXISTS idx_images_status_id ON images(status_id);
                CREATE INDEX IF NOT EXISTS idx_images_root_id ON images(root_id);
                CREATE INDEX IF NOT EXISTS idx_images_xmlid ON images(xmlid);
            `)
            console.log('    ✓ Created indexes on images table')

            console.log('\n✅ Chapter 5B.4 completed: Images table created with all types and triggers')
        } else {
            console.log('    ⚠️  SQLite: Images table creation not supported (requires PostgreSQL)')
        }

        // ===================================================================
        // CHAPTER 6: Align Tasks, Add Status FK
        // ===================================================================
        console.log('\n📖 Chapter 6: Align Tasks, Add Status FK')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 6.1: Rename columns: title → name, image → cimg
            // -------------------------------------------------------------------
            console.log('\n  🔄 Renaming task columns...')

            // Check if columns exist before renaming
            const titleCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'title'
            `, [])

            if (titleCol.length > 0) {
                await db.exec(`ALTER TABLE tasks RENAME COLUMN title TO name`)
                console.log('    ✓ Renamed title → name')
            } else {
                console.log('    ⚠️  Column title not found, skipping rename')
            }

            const imageCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'image'
            `, [])

            if (imageCol.length > 0) {
                await db.exec(`ALTER TABLE tasks RENAME COLUMN image TO cimg`)
                console.log('    ✓ Renamed image → cimg')
            } else {
                console.log('    ⚠️  Column image not found, skipping rename')
            }

            // -------------------------------------------------------------------
            // 6.2: Add new status column as INTEGER FK
            // -------------------------------------------------------------------
            console.log('\n  📊 Adding status FK column...')

            // Check if status_new column already exists
            const statusNewCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'status_new'
            `, [])

            if (statusNewCol.length === 0) {
                // Add new status column as INTEGER
                await db.exec(`
                    ALTER TABLE tasks 
                    ADD COLUMN status_new INTEGER
                `)
                console.log('    ✓ Added status_new INTEGER column')
            } else {
                console.log('    ⚠️  status_new column already exists')
            }

            // -------------------------------------------------------------------
            // 6.3: Migrate status data TEXT → INTEGER
            // -------------------------------------------------------------------
            console.log('\n  🔄 Migrating status values...')

            // Map old TEXT status to new INTEGER status values
            // old status: 'idea', 'draft', 'final', 'reopen', 'trash', 'new'
            // new status: idea/1, draft/2, active/4, final/5, reopen/8, trash/16, new/0

            // Get task status ID for 'idea' (default)
            const ideaStatus = await db.get(`
                SELECT id FROM status 
                WHERE "table" = 'tasks' AND name = 'idea'
                LIMIT 1
            `, [])

            if (!ideaStatus) {
                throw new Error('Status entry for tasks.idea not found. Run migration 021 first.')
            }

            const ideaStatusId = ideaStatus.id

            // Map old status values to new status IDs
            const statusMappings = [
                { oldValue: 'new', newName: 'new' },
                { oldValue: 'idea', newName: 'idea' },
                { oldValue: 'draft', newName: 'draft' },
                { oldValue: 'final', newName: 'final' },
                { oldValue: 'reopen', newName: 'reopen' },
                { oldValue: 'trash', newName: 'trash' }
            ]

            for (const mapping of statusMappings) {
                const statusRecord = await db.get(`
                    SELECT id FROM status 
                    WHERE "table" = 'tasks' AND name = $1
                    LIMIT 1
                `, [mapping.newName])

                if (statusRecord) {
                    await db.exec(`
                        UPDATE tasks 
                        SET status_new = ${statusRecord.id}
                        WHERE status = '${mapping.oldValue}'
                    `)
                    console.log(`    ✓ Mapped '${mapping.oldValue}' → status.id=${statusRecord.id}`)
                }
            }

            // Set default for any remaining NULL values
            await db.exec(`
                UPDATE tasks 
                SET status_new = ${ideaStatusId}
                WHERE status_new IS NULL
            `)
            console.log(`    ✓ Set default status to idea (id=${ideaStatusId}) for remaining tasks`)

            // -------------------------------------------------------------------
            // 6.4: Drop old status column, rename new one
            // -------------------------------------------------------------------
            console.log('\n  🗑️  Replacing old status column...')

            await db.exec(`ALTER TABLE tasks DROP COLUMN IF EXISTS status`)
            console.log('    ✓ Dropped old TEXT status column')

            await db.exec(`ALTER TABLE tasks RENAME COLUMN status_new TO status_id`)
            console.log('    ✓ Renamed status_new → status_id')

            // -------------------------------------------------------------------
            // 6.5: Add foreign key constraint and default
            // -------------------------------------------------------------------
            console.log('\n  🔗 Adding FK constraint and default...')

            // Add NOT NULL constraint
            await db.exec(`
                ALTER TABLE tasks 
                ALTER COLUMN status_id SET NOT NULL
            `)
            console.log('    ✓ Added NOT NULL constraint')

            // Add default value (idea status)
            await db.exec(`
                ALTER TABLE tasks 
                ALTER COLUMN status_id SET DEFAULT ${ideaStatusId}
            `)
            console.log(`    ✓ Set default to idea (id=${ideaStatusId})`)

            // Add foreign key constraint
            await db.exec(`
                ALTER TABLE tasks 
                ADD CONSTRAINT tasks_status_id_fkey 
                FOREIGN KEY (status_id) REFERENCES status(id)
            `)
            console.log('    ✓ Added FK constraint to status table')

            console.log('\n✅ Chapter 6 completed: Tasks aligned with name/cimg fields and status_id FK')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: Tasks migration requires manual handling')
            console.log('    ⚠️  SQLite migration for tasks not yet implemented')
        }

        // ===================================================================
        // CHAPTER 7: Align Instructors, Add header_size
        // ===================================================================
        console.log('\n📖 Chapter 7: Align Instructors, Add header_size')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 7.1: Add header_size field to instructors
            // -------------------------------------------------------------------
            console.log('\n  📐 Adding header_size field to instructors...')

            // Check if column already exists
            const headerSizeCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'instructors' AND column_name = 'header_size'
            `, [])

            if (headerSizeCol.length === 0) {
                await db.exec(`
                    ALTER TABLE instructors 
                    ADD COLUMN header_size TEXT 
                    CHECK (header_size IN ('small', 'medium', 'large'))
                `)
                console.log('    ✓ Added instructors.header_size field')
            } else {
                console.log('    ⚠️  instructors.header_size already exists, skipping')
            }

            console.log('\n✅ Chapter 7 completed: Instructors aligned with header_size field')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: Instructors migration requires manual handling')
            console.log('    ⚠️  SQLite migration for instructors not yet implemented')
        }

        // ===================================================================
        // CHAPTER 8: Enable Native Tags (events, posts)
        // ===================================================================
        console.log('\n📖 Chapter 8: Enable Native Tags')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 8.1: Add lang field to events and posts
            // -------------------------------------------------------------------
            console.log('\n  🌐 Adding lang field to events and posts...')

            // Add lang to events
            const eventsLangCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'lang'
            `, [])

            if (eventsLangCol.length === 0) {
                await db.exec(`
                    ALTER TABLE events 
                    ADD COLUMN lang TEXT DEFAULT 'de' 
                    CHECK (lang IN ('de', 'en', 'cz'))
                `)
                console.log('    ✓ Added events.lang field')
            } else {
                console.log('    ⚠️  events.lang already exists, skipping')
            }

            // Add lang to posts
            const postsLangCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'lang'
            `, [])

            if (postsLangCol.length === 0) {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD COLUMN lang TEXT DEFAULT 'de' 
                    CHECK (lang IN ('de', 'en', 'cz'))
                `)
                console.log('    ✓ Added posts.lang field')
            } else {
                console.log('    ⚠️  posts.lang already exists, skipping')
            }

            // -------------------------------------------------------------------
            // 8.2: Verify junction tables for tags exist
            // -------------------------------------------------------------------
            console.log('\n  🔗 Verifying events_tags and posts_tags junction tables...')

            // Note: These tables are now created in Chapter 3B during events/posts migration
            // This section just verifies they exist

            const eventsTagsCheck = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'events_tags'
                )
            `)

            if ((eventsTagsCheck as any).exists) {
                console.log('    ✓ events_tags table exists')
            } else {
                // Create if it doesn't exist (for edge cases)
                await db.exec(`
                    CREATE TABLE IF NOT EXISTS events_tags (
                        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (event_id, tag_id)
                    )
                `)
                console.log('    ✓ Created events_tags table')
            }

            const postsTagsCheck = await db.get(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'posts_tags'
                )
            `)

            if ((postsTagsCheck as any).exists) {
                console.log('    ✓ posts_tags table exists')
            } else {
                // Create if it doesn't exist (for edge cases)
                await db.exec(`
                    CREATE TABLE IF NOT EXISTS posts_tags (
                        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (post_id, tag_id)
                    )
                `)
                console.log('    ✓ Created posts_tags table')
            }

            // Create indexes
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_events_tags_event ON events_tags(event_id)
            `)
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_events_tags_tag ON events_tags(tag_id)
            `)
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_posts_tags_post ON posts_tags(post_id)
            `)
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_posts_tags_tag ON posts_tags(tag_id)
            `)
            console.log('    ✓ Verified indexes for tag junction tables')

            // -------------------------------------------------------------------
            // 8.3: Add computed columns for tags_ids and tags_display
            // -------------------------------------------------------------------
            console.log('\n  🏷️  Adding computed tag columns...')

            // Note: PostgreSQL GENERATED columns cannot use subqueries
            // We'll add regular columns and use triggers to maintain them

            // Add columns to events
            const eventsTagsIdsCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'tags_ids'
            `, [])

            if (eventsTagsIdsCol.length === 0) {
                await db.exec(`
                    ALTER TABLE events 
                    ADD COLUMN tags_ids INTEGER[] DEFAULT '{}'
                `)
                await db.exec(`
                    ALTER TABLE events 
                    ADD COLUMN tags_display TEXT[] DEFAULT '{}'
                `)
                console.log('    ✓ Added events.tags_ids and events.tags_display')
            } else {
                console.log('    ⚠️  events.tags_ids already exists, skipping')
            }

            // Add columns to posts
            const postsTagsIdsCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'tags_ids'
            `, [])

            if (postsTagsIdsCol.length === 0) {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD COLUMN tags_ids INTEGER[] DEFAULT '{}'
                `)
                await db.exec(`
                    ALTER TABLE posts 
                    ADD COLUMN tags_display TEXT[] DEFAULT '{}'
                `)
                console.log('    ✓ Added posts.tags_ids and posts.tags_display')
            } else {
                console.log('    ⚠️  posts.tags_ids already exists, skipping')
            }

            // -------------------------------------------------------------------
            // 8.4: Create trigger functions to maintain computed tag columns
            // -------------------------------------------------------------------
            console.log('\n  ⚙️  Creating triggers for tag columns...')

            // Function to update events tags
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
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_events_tags ON events_tags;
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_events_tags
                AFTER INSERT OR UPDATE OR DELETE ON events_tags
                FOR EACH ROW
                EXECUTE FUNCTION update_events_tags();
            `)
            console.log('    ✓ Created trigger for events tags')

            // Function to update posts tags
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
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_posts_tags ON posts_tags;
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_posts_tags
                AFTER INSERT OR UPDATE OR DELETE ON posts_tags
                FOR EACH ROW
                EXECUTE FUNCTION update_posts_tags();
            `)
            console.log('    ✓ Created trigger for posts tags')

            // Trigger to update tags_display when lang changes
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_events_lang()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.lang IS DISTINCT FROM OLD.lang THEN
                        NEW.tags_display = COALESCE((
                            SELECT ARRAY_AGG(
                                COALESCE(
                                    t.name_i18n->>NEW.lang,
                                    t.name
                                ) ORDER BY t.name
                            )
                            FROM events_tags et
                            JOIN tags t ON et.tag_id = t.id
                            WHERE et.event_id = NEW.id
                        ), '{}');
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_events_lang ON events;
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_events_lang
                BEFORE UPDATE OF lang ON events
                FOR EACH ROW
                EXECUTE FUNCTION update_events_lang();
            `)
            console.log('    ✓ Created trigger for events lang changes')

            await db.exec(`
                CREATE OR REPLACE FUNCTION update_posts_lang()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.lang IS DISTINCT FROM OLD.lang THEN
                        NEW.tags_display = COALESCE((
                            SELECT ARRAY_AGG(
                                COALESCE(
                                    t.name_i18n->>NEW.lang,
                                    t.name
                                ) ORDER BY t.name
                            )
                            FROM posts_tags pt
                            JOIN tags t ON pt.tag_id = t.id
                            WHERE pt.post_id = NEW.id
                        ), '{}');
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_posts_lang ON posts;
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_posts_lang
                BEFORE UPDATE OF lang ON posts
                FOR EACH ROW
                EXECUTE FUNCTION update_posts_lang();
            `)
            console.log('    ✓ Created trigger for posts lang changes')

            console.log('\n✅ Chapter 8 completed: Native tags enabled for events and posts')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: Tags migration requires manual handling')
            console.log('    ⚠️  SQLite migration for tags not yet implemented')
        }

        // ===================================================================
        // CHAPTER 9: Surface regio_id
        // ===================================================================
        console.log('\n📖 Chapter 9: Surface regio_id')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 9.1: Add regio_id to events, posts, instructors
            // -------------------------------------------------------------------
            console.log('\n  🗺️  Adding regio_id computed columns...')

            // Add to events
            const eventsRegioCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'regio_id'
            `, [])

            if (eventsRegioCol.length === 0) {
                await db.exec(`
                    ALTER TABLE events 
                    ADD COLUMN regio_id INTEGER
                `)
                console.log('    ✓ Added events.regio_id')
            } else {
                console.log('    ⚠️  events.regio_id already exists, skipping')
            }

            // Add to posts
            const postsRegioCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'regio_id'
            `, [])

            if (postsRegioCol.length === 0) {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD COLUMN regio_id INTEGER
                `)
                console.log('    ✓ Added posts.regio_id')
            } else {
                console.log('    ⚠️  posts.regio_id already exists, skipping')
            }

            // Add to instructors
            const instructorsRegioCol = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'instructors' AND column_name = 'regio_id'
            `, [])

            if (instructorsRegioCol.length === 0) {
                await db.exec(`
                    ALTER TABLE instructors 
                    ADD COLUMN regio_id INTEGER
                `)
                console.log('    ✓ Added instructors.regio_id')
            } else {
                console.log('    ⚠️  instructors.regio_id already exists, skipping')
            }

            // -------------------------------------------------------------------
            // 9.2: Create trigger functions to maintain regio_id
            // -------------------------------------------------------------------
            console.log('\n  ⚙️  Creating triggers for regio_id...')

            // Function to update events regio_id (now uses project_id INTEGER)
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_events_regio()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Lookup project and get its regio field
                    NEW.regio_id = (
                        SELECT p.regio
                        FROM projects p
                        WHERE p.id = NEW.project_id
                        LIMIT 1
                    );
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_events_regio ON events;
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_events_regio
                BEFORE INSERT OR UPDATE OF project_id ON events
                FOR EACH ROW
                EXECUTE FUNCTION update_events_regio();
            `)
            console.log('    ✓ Created trigger for events regio_id')

            // Function to update posts regio_id (now uses project_id INTEGER)
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_posts_regio()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Lookup project and get its regio field
                    NEW.regio_id = (
                        SELECT p.regio
                        FROM projects p
                        WHERE p.id = NEW.project_id
                        LIMIT 1
                    );
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_posts_regio ON posts;
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_posts_regio
                BEFORE INSERT OR UPDATE OF project_id ON posts
                FOR EACH ROW
                EXECUTE FUNCTION update_posts_regio();
            `)
            console.log('    ✓ Created trigger for posts regio_id')

            // Function to update instructors regio_id
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_instructors_regio()
                RETURNS TRIGGER AS $$
                DECLARE
                    v_user_id INTEGER;
                BEGIN
                    -- Only if is_user is true
                    IF NEW.is_user = TRUE THEN
                        -- Find the user that links to this instructor
                        SELECT id INTO v_user_id
                        FROM users
                        WHERE instructor_id = NEW.id
                        LIMIT 1;
                        
                        IF v_user_id IS NOT NULL THEN
                            -- Find regio project where user is owner or member
                            NEW.regio_id = (
                                SELECT p.id
                                FROM projects p
                                WHERE p.is_regio = TRUE
                                AND (
                                    p.owner_id = v_user_id
                                    OR v_user_id::TEXT = ANY(
                                        SELECT jsonb_array_elements_text(p.member_ids)
                                    )
                                )
                                LIMIT 1
                            );
                        END IF;
                    ELSE
                        NEW.regio_id = NULL;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trg_update_instructors_regio ON instructors;
            `)
            await db.exec(`
                CREATE TRIGGER trg_update_instructors_regio
                BEFORE INSERT OR UPDATE OF is_user ON instructors
                FOR EACH ROW
                EXECUTE FUNCTION update_instructors_regio();
            `)
            console.log('    ✓ Created trigger for instructors regio_id')

            // -------------------------------------------------------------------
            // 9.3: Initial population of regio_id
            // -------------------------------------------------------------------
            console.log('\n  📊 Populating initial regio_id values...')

            // Update events (now uses project_id INTEGER)
            await db.exec(`
                UPDATE events e
                SET regio_id = p.regio
                FROM projects p
                WHERE p.id = e.project_id AND p.regio IS NOT NULL
            `)
            console.log('    ✓ Populated events.regio_id')

            // Update posts (now uses project_id INTEGER)
            await db.exec(`
                UPDATE posts po
                SET regio_id = p.regio
                FROM projects p
                WHERE p.id = po.project_id AND p.regio IS NOT NULL
            `)
            console.log('    ✓ Populated posts.regio_id')

            // Update instructors
            await db.exec(`
                UPDATE instructors i
                SET regio_id = (
                    SELECT p.id
                    FROM projects p
                    JOIN users u ON u.instructor_id = i.id
                    WHERE p.is_regio = TRUE
                    AND (
                        p.owner_id = u.id
                        OR u.id::TEXT = ANY(
                            SELECT jsonb_array_elements_text(p.member_ids)
                        )
                    )
                    LIMIT 1
                )
                WHERE i.is_user = TRUE
            `)
            console.log('    ✓ Populated instructors.regio_id')

            console.log('\n✅ Chapter 9 completed: regio_id surfaced for events, posts, and instructors')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: regio_id migration requires manual handling')
            console.log('    ⚠️  SQLite migration for regio_id not yet implemented')
        }

        // ===================================================================
        // CHAPTER 10: Block Publishing of Invalid Events
        // ===================================================================
        console.log('\n📖 Chapter 10: Block Publishing of Invalid Events')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 10.1: Create validation function for event status
            // -------------------------------------------------------------------
            console.log('\n  🚫 Creating event publishing validation...')

            await db.exec(`
                CREATE OR REPLACE FUNCTION validate_event_status()
                RETURNS TRIGGER AS $$
                DECLARE
                    v_status_value INTEGER;
                    v_instructor_is_user BOOLEAN;
                BEGIN
                    -- Get the numeric value of the status
                    -- NOTE: events still uses TEXT status column, not status_id
                    -- Map common status names to values
                    CASE NEW.status
                        WHEN 'new' THEN v_status_value := 0;
                        WHEN 'idea' THEN v_status_value := 1;
                        WHEN 'draft' THEN v_status_value := 2;
                        WHEN 'active' THEN v_status_value := 4;
                        WHEN 'final' THEN v_status_value := 5;
                        WHEN 'published' THEN v_status_value := 4;
                        WHEN 'reopen' THEN v_status_value := 8;
                        WHEN 'trash' THEN v_status_value := 16;
                        ELSE v_status_value := 1; -- Default to idea
                    END CASE;

                    -- If status is going > 2 (publishing), validate public_user
                    IF v_status_value > 2 THEN
                        -- Check if public_user is an instructor with is_user = TRUE
                        IF NEW.public_user IS NULL THEN
                            RAISE EXCEPTION 'Cannot publish event: public_user must be set to an instructor with is_user=TRUE';
                        END IF;

                        SELECT is_user INTO v_instructor_is_user
                        FROM instructors
                        WHERE id = NEW.public_user
                        LIMIT 1;

                        IF v_instructor_is_user IS NULL THEN
                            RAISE EXCEPTION 'Cannot publish event: public_user (%) does not exist in instructors', NEW.public_user;
                        END IF;

                        IF v_instructor_is_user != TRUE THEN
                            RAISE EXCEPTION 'Cannot publish event: public_user (%) must be an instructor with is_user=TRUE', NEW.public_user;
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trg_validate_event_status ON events;
            `)
            await db.exec(`
                CREATE TRIGGER trg_validate_event_status
                BEFORE INSERT OR UPDATE OF status, public_user ON events
                FOR EACH ROW
                EXECUTE FUNCTION validate_event_status();
            `)
            console.log('    ✓ Created validation trigger for event publishing')

            console.log('\n✅ Chapter 10 completed: Event publishing validation enabled')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: Event validation requires manual handling')
            console.log('    ⚠️  SQLite migration for event validation not yet implemented')
        }

        // ===================================================================
        // CHAPTER 11: Extend Projects with Page/Aside/Header/Footer Options
        // ===================================================================
        console.log('\n📖 Chapter 11: Extend Projects with Page/Aside/Header/Footer Options')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 11.1: Add page options (allow empty, default to empty)
            // -------------------------------------------------------------------
            console.log('\n  📄 Adding page options to projects...')

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS page_background TEXT DEFAULT '',
                ADD COLUMN IF NOT EXISTS page_cssvars JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS page_navigation JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS page_options_ext JSONB DEFAULT '{}'
            `)

            console.log('    ✓ Added page options fields (allow empty)')

            // -------------------------------------------------------------------
            // 11.2: Add aside options (allow empty, default to empty)
            // -------------------------------------------------------------------
            console.log('\n  📌 Adding aside options to projects...')

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS aside_postit JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS aside_toc JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS aside_list TEXT DEFAULT '',
                ADD COLUMN IF NOT EXISTS aside_context JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS aside_options_ext JSONB DEFAULT '{}'
            `)

            console.log('    ✓ Added aside options fields (allow empty)')

            // -------------------------------------------------------------------
            // 11.3: Add header options (allow empty, default to empty)
            // -------------------------------------------------------------------
            console.log('\n  🎯 Adding header options to projects...')

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS header_alert JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS header_postit JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS header_options_ext JSONB DEFAULT '{}'
            `)

            console.log('    ✓ Added header options fields (allow empty)')

            // -------------------------------------------------------------------
            // 11.4: Add footer options (allow empty, default to empty)
            // -------------------------------------------------------------------
            console.log('\n  🦶 Adding footer options to projects...')

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS footer_gallery TEXT DEFAULT '',
                ADD COLUMN IF NOT EXISTS footer_postit JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS footer_slider TEXT DEFAULT '',
                ADD COLUMN IF NOT EXISTS footer_repeat JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS footer_sitemap TEXT DEFAULT '',
                ADD COLUMN IF NOT EXISTS footer_options_ext JSONB DEFAULT '{}'
            `)

            console.log('    ✓ Added footer options fields (allow empty)')

            // -------------------------------------------------------------------
            // 11.5: Add computed has_content columns (stored as generated)
            // -------------------------------------------------------------------
            console.log('\n  🧮 Adding computed has_content columns...')

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS page_has_content BOOLEAN 
                GENERATED ALWAYS AS (
                    COALESCE(page_background, '') != '' OR
                    COALESCE(page_cssvars::text, '{}') != '{}' OR
                    COALESCE(page_navigation::text, '{}') != '{}' OR
                    COALESCE(page_options_ext::text, '{}') != '{}'
                ) STORED
            `)

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS aside_has_content BOOLEAN 
                GENERATED ALWAYS AS (
                    COALESCE(aside_postit::text, '{}') != '{}' OR
                    COALESCE(aside_toc::text, '{}') != '{}' OR
                    COALESCE(aside_list, '') != '' OR
                    COALESCE(aside_context::text, '{}') != '{}' OR
                    COALESCE(aside_options_ext::text, '{}') != '{}'
                ) STORED
            `)

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS header_has_content BOOLEAN 
                GENERATED ALWAYS AS (
                    COALESCE(header_alert::text, '{}') != '{}' OR
                    COALESCE(header_postit::text, '{}') != '{}' OR
                    COALESCE(header_options_ext::text, '{}') != '{}'
                ) STORED
            `)

            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS footer_has_content BOOLEAN 
                GENERATED ALWAYS AS (
                    COALESCE(footer_gallery, '') != '' OR
                    COALESCE(footer_postit::text, '{}') != '{}' OR
                    COALESCE(footer_slider, '') != '' OR
                    COALESCE(footer_repeat::text, '{}') != '{}' OR
                    COALESCE(footer_sitemap, '') != '' OR
                    COALESCE(footer_options_ext::text, '{}') != '{}'
                ) STORED
            `)

            console.log('    ✓ Added has_content computed columns (page, aside, header, footer)')

            console.log('\n✅ Chapter 11 completed: Project schema extended with page, aside, header, and footer options plus has_content flags')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: Project schema extension not yet implemented')
        }

        // ===================================================================
        // CHAPTER 12: Extend Pages with Page/Aside/Header/Footer Options
        // ===================================================================
        console.log('\n📖 Chapter 12: Extend Pages with Page/Aside/Header/Footer Options')

        if (isPostgres) {
            // -------------------------------------------------------------------
            // 12.1: Add page_options field
            // -------------------------------------------------------------------
            console.log('\n  📄 Adding page_options field...')

            await db.exec(`
                ALTER TABLE pages 
                ADD COLUMN IF NOT EXISTS page_options JSONB DEFAULT '{}'::jsonb
            `)

            console.log('    ✓ Added page_options JSONB field')

            // -------------------------------------------------------------------
            // 12.2: Add header_options field
            // -------------------------------------------------------------------
            console.log('\n  📄 Adding header_options field...')

            await db.exec(`
                ALTER TABLE pages 
                ADD COLUMN IF NOT EXISTS header_options JSONB DEFAULT '{}'::jsonb
            `)

            console.log('    ✓ Added header_options JSONB field')

            // -------------------------------------------------------------------
            // 12.3: Add aside_options field
            // -------------------------------------------------------------------
            console.log('\n  📄 Adding aside_options field...')

            await db.exec(`
                ALTER TABLE pages 
                ADD COLUMN IF NOT EXISTS aside_options JSONB DEFAULT '{}'::jsonb
            `)

            console.log('    ✓ Added aside_options JSONB field')

            // -------------------------------------------------------------------
            // 12.4: Add footer_options field
            // -------------------------------------------------------------------
            console.log('\n  📄 Adding footer_options field...')

            await db.exec(`
                ALTER TABLE pages 
                ADD COLUMN IF NOT EXISTS footer_options JSONB DEFAULT '{}'::jsonb
            `)

            console.log('    ✓ Added footer_options JSONB field')

            // -------------------------------------------------------------------
            // 12.5: Add computed has_content columns
            // -------------------------------------------------------------------
            console.log('\n  🔢 Adding has_content computed columns...')

            await db.exec(`
                ALTER TABLE pages 
                ADD COLUMN IF NOT EXISTS page_has_content BOOLEAN 
                GENERATED ALWAYS AS (
                    COALESCE(page_options::text, '{}') = '{}'
                ) STORED
            `)

            await db.exec(`
                ALTER TABLE pages 
                ADD COLUMN IF NOT EXISTS aside_has_content BOOLEAN 
                GENERATED ALWAYS AS (
                    COALESCE(aside_options::text, '{}') = '{}'
                ) STORED
            `)

            await db.exec(`
                ALTER TABLE pages 
                ADD COLUMN IF NOT EXISTS header_has_content BOOLEAN 
                GENERATED ALWAYS AS (
                    COALESCE(header_options::text, '{}') = '{}'
                ) STORED
            `)

            await db.exec(`
                ALTER TABLE pages 
                ADD COLUMN IF NOT EXISTS footer_has_content BOOLEAN 
                GENERATED ALWAYS AS (
                    COALESCE(footer_options::text, '{}') = '{}'
                ) STORED
            `)

            console.log('    ✓ Added has_content computed columns (page, aside, header, footer) - True when JSON is empty')

            console.log('\n✅ Chapter 12 completed: Pages schema extended with page, aside, header, and footer options plus has_content flags')

        } else {
            // SQLite implementation
            console.log('    ⚠️  SQLite: Pages schema extension not yet implemented')
        }

        // ===================================================================
        // CHAPTER 13: Add img_id to Entity Tables
        // ===================================================================
        console.log('\n📖 Chapter 13: Add img_id Foreign Key to Entity Tables')

        if (isPostgres) {
            // Add img_id to users
            await db.exec(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS img_id INTEGER DEFAULT NULL REFERENCES images(id) ON DELETE SET NULL
            `)
            console.log('    ✓ Added img_id to users')

            // Add img_id to instructors
            await db.exec(`
                ALTER TABLE instructors 
                ADD COLUMN IF NOT EXISTS img_id INTEGER DEFAULT NULL REFERENCES images(id) ON DELETE SET NULL
            `)
            console.log('    ✓ Added img_id to instructors')

            // Add img_id to events
            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN IF NOT EXISTS img_id INTEGER DEFAULT NULL REFERENCES images(id) ON DELETE SET NULL
            `)
            console.log('    ✓ Added img_id to events')

            // Add img_id to locations
            await db.exec(`
                ALTER TABLE locations 
                ADD COLUMN IF NOT EXISTS img_id INTEGER DEFAULT NULL REFERENCES images(id) ON DELETE SET NULL
            `)
            console.log('    ✓ Added img_id to locations')

            // Add img_id to posts
            await db.exec(`
                ALTER TABLE posts 
                ADD COLUMN IF NOT EXISTS img_id INTEGER DEFAULT NULL REFERENCES images(id) ON DELETE SET NULL
            `)
            console.log('    ✓ Added img_id to posts')

            // Add img_id to projects
            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS img_id INTEGER DEFAULT NULL REFERENCES images(id) ON DELETE SET NULL
            `)
            console.log('    ✓ Added img_id to projects')

            // Create indexes
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_users_img_id ON users(img_id);
                CREATE INDEX IF NOT EXISTS idx_instructors_img_id ON instructors(img_id);
                CREATE INDEX IF NOT EXISTS idx_events_img_id ON events(img_id);
                CREATE INDEX IF NOT EXISTS idx_locations_img_id ON locations(img_id);
                CREATE INDEX IF NOT EXISTS idx_posts_img_id ON posts(img_id);
                CREATE INDEX IF NOT EXISTS idx_projects_img_id ON projects(img_id);
            `)
            console.log('    ✓ Created indexes on img_id columns')

            console.log('\n✅ Chapter 13 completed: img_id foreign key added to all 6 entity tables')
        } else {
            console.log('    ⚠️  SQLite: img_id column addition not supported')
        }

        // ===================================================================
        // CHAPTER 14: Add Performance Optimization Fields for Images
        // ===================================================================
        console.log('\n📖 Chapter 14: Add Image Performance Fields to Entity Tables')

        if (isPostgres) {
            // Create helper function to reduce image_shape to URL or JSON
            await db.exec(`
                CREATE OR REPLACE FUNCTION reduce_image_shape(shape image_shape) 
                RETURNS TEXT AS $$
                DECLARE
                    result_json JSONB;
                BEGIN
                    IF shape IS NULL THEN
                        RETURN NULL;
                    END IF;
                    
                    -- Option a) Preferred: if shape.json exists, serialize it with type=json
                    IF (shape).json IS NOT NULL THEN
                        result_json := jsonb_build_object('type', 'json') || (shape).json;
                        RETURN result_json::text;
                    END IF;
                    
                    -- Option b) Alternative: if x/y/z exist, create params JSON
                    IF (shape).x IS NOT NULL OR (shape).y IS NOT NULL OR (shape).z IS NOT NULL THEN
                        result_json := jsonb_build_object(
                            'type', 'param',
                            'x', (shape).x,
                            'y', (shape).y,
                            'z', (shape).z
                        );
                        RETURN result_json::text;
                    END IF;
                    
                    -- Fallback: return url
                    RETURN (shape).url;
                END;
                $$ LANGUAGE plpgsql IMMUTABLE;
            `)
            console.log('    ✓ Created reduce_image_shape helper function')

            // TODO: READD Fields
            // Add img_thumb, img_square, img_wide, img_vert (JSONB) and img_show (BOOLEAN) 
            // to images table
            console.log('\n  📊 Adding computed fields to images table...')
            await db.exec(`
                ALTER TABLE images
                ADD COLUMN IF NOT EXISTS img_show BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS img_thumb JSONB,
                ADD COLUMN IF NOT EXISTS img_square JSONB,
                ADD COLUMN IF NOT EXISTS img_wide JSONB,
                ADD COLUMN IF NOT EXISTS img_vert JSONB
            `)
            console.log('    ✓ Added img_show (BOOLEAN) and 4 JSONB fields (img_thumb, img_square, img_wide, img_vert) to images table')

            // TODO: READD reduceImageShape
            // Create trigger on images table to compute the 4 JSONB fields based on shape composites
            // This will be a row-level trigger that only operates on the images table itself
            console.log('\n  🔧 Creating image shape reducer trigger...')
            await db.exec(`
                CREATE OR REPLACE FUNCTION compute_image_shape_fields()
                RETURNS TRIGGER AS $$
                DECLARE
                    fallback_json JSONB;
                BEGIN
                    -- Compute img_show: true if quality bits (6+7) are 0 (ok) or 64 (is_deprecated)
                    NEW.img_show := (get_byte(NEW.ctags, 0) & 192) IN (0, 64);

                    -- Loop 1: Compute img_square (creates fallback for img_thumb)
                    IF (NEW.shape_square).json IS NOT NULL THEN
                        NEW.img_square := (NEW.shape_square).json;
                    ELSIF (NEW.shape_square).x IS NOT NULL OR (NEW.shape_square).y IS NOT NULL OR (NEW.shape_square).z IS NOT NULL THEN
                        NEW.img_square := jsonb_build_object(
                            'type', 'params',
                            'x', (NEW.shape_square).x,
                            'y', (NEW.shape_square).y,
                            'z', (NEW.shape_square).z
                        );
                    ELSIF (NEW.shape_square).url IS NOT NULL THEN
                        NEW.img_square := jsonb_build_object('url', (NEW.shape_square).url);
                    ELSE
                        NEW.img_square := jsonb_build_object('error', true);
                    END IF;
                    
                    -- Add blur/turl/tpar if present
                    IF (NEW.shape_square).blur IS NOT NULL THEN
                        NEW.img_square := NEW.img_square || jsonb_build_object('blur', (NEW.shape_square).blur);
                    END IF;
                    IF (NEW.shape_square).turl IS NOT NULL THEN
                        NEW.img_square := NEW.img_square || jsonb_build_object('turl', (NEW.shape_square).turl);
                    END IF;
                    IF (NEW.shape_square).tpar IS NOT NULL THEN
                        NEW.img_square := NEW.img_square || jsonb_build_object('tpar', (NEW.shape_square).tpar);
                    END IF;
                    
                    -- Store fallback for Loop 2
                    fallback_json := NEW.img_square;

                    -- Loop 2: Compute img_thumb (can use fallback from img_square)
                    IF (NEW.shape_thumb).json IS NOT NULL THEN
                        NEW.img_thumb := (NEW.shape_thumb).json;
                    ELSIF (NEW.shape_thumb).x IS NOT NULL OR (NEW.shape_thumb).y IS NOT NULL OR (NEW.shape_thumb).z IS NOT NULL THEN
                        NEW.img_thumb := jsonb_build_object(
                            'type', 'params',
                            'x', (NEW.shape_thumb).x,
                            'y', (NEW.shape_thumb).y,
                            'z', (NEW.shape_thumb).z
                        );
                    ELSIF (NEW.shape_thumb).url IS NOT NULL THEN
                        NEW.img_thumb := jsonb_build_object('url', (NEW.shape_thumb).url);
                    ELSE
                        -- Use fallback from img_square
                        NEW.img_thumb := fallback_json;
                    END IF;

                    -- Add blur/turl/tpar if present
                    IF (NEW.shape_thumb).blur IS NOT NULL THEN
                        NEW.img_thumb := NEW.img_thumb || jsonb_build_object('blur', (NEW.shape_thumb).blur);
                    END IF;
                    IF (NEW.shape_thumb).turl IS NOT NULL THEN
                        NEW.img_thumb := NEW.img_thumb || jsonb_build_object('turl', (NEW.shape_thumb).turl);
                    END IF;
                    IF (NEW.shape_thumb).tpar IS NOT NULL THEN
                        NEW.img_thumb := NEW.img_thumb || jsonb_build_object('tpar', (NEW.shape_thumb).tpar);
                    END IF;

                    -- Loop 3: Compute img_wide (no fallback, use enabled:false)
                    IF (NEW.shape_wide).json IS NOT NULL THEN
                        NEW.img_wide := (NEW.shape_wide).json;
                    ELSIF (NEW.shape_wide).x IS NOT NULL OR (NEW.shape_wide).y IS NOT NULL OR (NEW.shape_wide).z IS NOT NULL THEN
                        NEW.img_wide := jsonb_build_object(
                            'type', 'params',
                            'x', (NEW.shape_wide).x,
                            'y', (NEW.shape_wide).y,
                            'z', (NEW.shape_wide).z
                        );
                    ELSIF (NEW.shape_wide).url IS NOT NULL THEN
                        NEW.img_wide := jsonb_build_object('url', (NEW.shape_wide).url);
                    ELSE
                        NEW.img_wide := jsonb_build_object('enabled', false);
                    END IF;

                    -- Add blur/turl/tpar if present
                    IF (NEW.shape_wide).blur IS NOT NULL THEN
                        NEW.img_wide := NEW.img_wide || jsonb_build_object('blur', (NEW.shape_wide).blur);
                    END IF;
                    IF (NEW.shape_wide).turl IS NOT NULL THEN
                        NEW.img_wide := NEW.img_wide || jsonb_build_object('turl', (NEW.shape_wide).turl);
                    END IF;
                    IF (NEW.shape_wide).tpar IS NOT NULL THEN
                        NEW.img_wide := NEW.img_wide || jsonb_build_object('tpar', (NEW.shape_wide).tpar);
                    END IF;

                    -- Loop 4: Compute img_vert (no fallback, use enabled:false)
                    IF (NEW.shape_vertical).json IS NOT NULL THEN
                        NEW.img_vert := (NEW.shape_vertical).json;
                    ELSIF (NEW.shape_vertical).x IS NOT NULL OR (NEW.shape_vertical).y IS NOT NULL OR (NEW.shape_vertical).z IS NOT NULL THEN
                        NEW.img_vert := jsonb_build_object(
                            'type', 'params',
                            'x', (NEW.shape_vertical).x,
                            'y', (NEW.shape_vertical).y,
                            'z', (NEW.shape_vertical).z
                        );
                    ELSIF (NEW.shape_vertical).url IS NOT NULL THEN
                        NEW.img_vert := jsonb_build_object('url', (NEW.shape_vertical).url);
                    ELSE
                        NEW.img_vert := jsonb_build_object('enabled', false);
                    END IF;

                    -- Add blur/turl/tpar if present
                    IF (NEW.shape_vertical).blur IS NOT NULL THEN
                        NEW.img_vert := NEW.img_vert || jsonb_build_object('blur', (NEW.shape_vertical).blur);
                    END IF;
                    IF (NEW.shape_vertical).turl IS NOT NULL THEN
                        NEW.img_vert := NEW.img_vert || jsonb_build_object('turl', (NEW.shape_vertical).turl);
                    END IF;
                    IF (NEW.shape_vertical).tpar IS NOT NULL THEN
                        NEW.img_vert := NEW.img_vert || jsonb_build_object('tpar', (NEW.shape_vertical).tpar);
                    END IF;

                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)
            console.log('    ✓ Created compute_image_shape_fields() function')

            await db.exec(`
                DROP TRIGGER IF EXISTS trigger_compute_image_shapes ON images;
                CREATE TRIGGER trigger_compute_image_shapes
                BEFORE INSERT OR UPDATE ON images
                FOR EACH ROW
                EXECUTE FUNCTION compute_image_shape_fields();
            `)
            console.log('    ✓ Created trigger_compute_image_shapes on images table')

            console.log('\n✅ Chapter 14 completed: Image shape reducer trigger added to images table')

            // ---------------------------------------------------------------
            // 14.2: Add img_* fields to entity tables
            // ---------------------------------------------------------------
            console.log('\n  📊 Adding img_* fields to entity tables for performance...')

            const entityTables = ['users', 'instructors', 'events', 'locations', 'posts', 'projects']

            for (const table of entityTables) {
                await db.exec(`
                    ALTER TABLE ${table}
                    ADD COLUMN IF NOT EXISTS img_show BOOLEAN DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS img_thumb JSONB,
                    ADD COLUMN IF NOT EXISTS img_square JSONB,
                    ADD COLUMN IF NOT EXISTS img_wide JSONB,
                    ADD COLUMN IF NOT EXISTS img_vert JSONB
                `)
                console.log(`    ✓ Added img_* fields to ${table}`)
            }

            // ---------------------------------------------------------------
            // 14.3: Create trigger to propagate img_* changes to entity tables
            // ---------------------------------------------------------------
            console.log('\n  🔧 Creating trigger to propagate img_* changes to entity tables...')

            await db.exec(`
                CREATE OR REPLACE FUNCTION propagate_image_fields_to_entities()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Update all entity tables that reference this image
                    UPDATE users SET 
                        img_show = NEW.img_show,
                        img_thumb = NEW.img_thumb,
                        img_square = NEW.img_square,
                        img_wide = NEW.img_wide,
                        img_vert = NEW.img_vert
                    WHERE img_id = NEW.id;

                    UPDATE instructors SET 
                        img_show = NEW.img_show,
                        img_thumb = NEW.img_thumb,
                        img_square = NEW.img_square,
                        img_wide = NEW.img_wide,
                        img_vert = NEW.img_vert
                    WHERE img_id = NEW.id;

                    UPDATE events SET 
                        img_show = NEW.img_show,
                        img_thumb = NEW.img_thumb,
                        img_square = NEW.img_square,
                        img_wide = NEW.img_wide,
                        img_vert = NEW.img_vert
                    WHERE img_id = NEW.id;

                    UPDATE locations SET 
                        img_show = NEW.img_show,
                        img_thumb = NEW.img_thumb,
                        img_square = NEW.img_square,
                        img_wide = NEW.img_wide,
                        img_vert = NEW.img_vert
                    WHERE img_id = NEW.id;

                    UPDATE posts SET 
                        img_show = NEW.img_show,
                        img_thumb = NEW.img_thumb,
                        img_square = NEW.img_square,
                        img_wide = NEW.img_wide,
                        img_vert = NEW.img_vert
                    WHERE img_id = NEW.id;

                    UPDATE projects SET 
                        img_show = NEW.img_show,
                        img_thumb = NEW.img_thumb,
                        img_square = NEW.img_square,
                        img_wide = NEW.img_wide,
                        img_vert = NEW.img_vert
                    WHERE img_id = NEW.id;

                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)
            console.log('    ✓ Created propagate_image_fields_to_entities() function')

            await db.exec(`
                DROP TRIGGER IF EXISTS trigger_propagate_to_entities ON images;
                CREATE TRIGGER trigger_propagate_to_entities
                AFTER INSERT OR UPDATE OF img_show, img_thumb, img_square, img_wide, img_vert, 
                    shape_thumb, shape_square, shape_wide, shape_vertical ON images
                FOR EACH ROW
                EXECUTE FUNCTION propagate_image_fields_to_entities();
            `)
            console.log('    ✓ Created trigger_propagate_to_entities on images table (fires on img_* and shape_* changes)')

            // ---------------------------------------------------------------
            // 14.3b: Create reverse trigger on entity tables (img_id changes)
            // ---------------------------------------------------------------
            console.log('\n  📝 Creating reverse propagation trigger on entity tables...')

            // Create trigger function for entity tables
            await db.exec(`
                CREATE OR REPLACE FUNCTION sync_image_fields_on_img_id_change()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- If img_id is set to NULL, clear all img_* fields
                    IF NEW.img_id IS NULL THEN
                        NEW.img_show := FALSE;
                        NEW.img_thumb := NULL;
                        NEW.img_square := NULL;
                        NEW.img_wide := NULL;
                        NEW.img_vert := NULL;
                    -- If img_id is set to a value (either INSERT or changed on UPDATE)
                    ELSIF NEW.img_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.img_id IS NULL OR OLD.img_id != NEW.img_id) THEN
                        SELECT 
                            i.img_show,
                            i.img_thumb,
                            i.img_square,
                            i.img_wide,
                            i.img_vert
                        INTO 
                            NEW.img_show,
                            NEW.img_thumb,
                            NEW.img_square,
                            NEW.img_wide,
                            NEW.img_vert
                        FROM images i
                        WHERE i.id = NEW.img_id;
                    END IF;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)
            console.log('    ✓ Created sync_image_fields_on_img_id_change() function')

            // Apply trigger to each entity table
            for (const table of entityTables) {
                await db.exec(`
                    DROP TRIGGER IF EXISTS trigger_sync_img_fields ON ${table};
                    CREATE TRIGGER trigger_sync_img_fields
                    BEFORE INSERT OR UPDATE OF img_id ON ${table}
                    FOR EACH ROW
                    EXECUTE FUNCTION sync_image_fields_on_img_id_change();
                `)
                console.log(`    ✓ Created trigger_sync_img_fields on ${table} (fires on img_id changes)`)
            }

            // ---------------------------------------------------------------
            // 14.4: Backfill existing data
            // ---------------------------------------------------------------
            console.log('\n  🔄 Backfilling img_* fields for existing entity records...')

            for (const table of entityTables) {
                await db.exec(`
                    UPDATE ${table} e
                    SET 
                        img_show = i.img_show,
                        img_thumb = i.img_thumb,
                        img_square = i.img_square,
                        img_wide = i.img_wide,
                        img_vert = i.img_vert
                    FROM images i
                    WHERE e.img_id = i.id
                `)
                console.log(`    ✓ Backfilled img_* fields for ${table}`)
            }

            console.log('\n✅ Chapter 14 completed: Image fields added to entity tables with propagation trigger')
        } else {
            console.log('    ⚠️  SQLite: Computed columns and triggers not supported')
        }

        console.log('\n✅ Migration 019 completed: All chapters complete - tables migrated, tags enabled, regio surfaced, validations added, project/pages options extended, and images system fully integrated')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 019: Add tags, status, and IDs...')

        if (isPostgres) {
            // Restore old users table structure would require backup
            console.log('  ⚠️  Warning: User migration rollback requires manual intervention')
        }

        // Drop tables in reverse order
        await db.exec('DROP TABLE IF EXISTS status')
        await db.exec('DROP TABLE IF EXISTS tags')

        console.log('✅ Migration 019 rolled back')
    }
}

export default migration
