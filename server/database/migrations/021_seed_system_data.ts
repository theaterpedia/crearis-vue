/**
 * Migration 021: System Data Seeding
 * 
 * Migration Chapters:
 * - Chapter 1: Seed System Tables (tags, status)
 * - Chapter 2: Seed Core System Data (config, projects, users, domains, memberships)
 * 
 * Consolidates all system-critical data seeding.
 * This data is required for the system to function properly.
 * 
 * Chapter 2 seeding order (respecting dependencies):
 * 1. System config (watchcsv, watchdb) - from migration 007
 * 2. Initial projects (tp, regio1) - from migration 014
 * 3. TLDs and system domains - from migration 015
 * 4. System users - from migration 015
 * 5. Project ownership assignments - from migration 015
 * 6. Project memberships - from migration 017
 */

import type { DatabaseAdapter } from '../adapter'
import bcrypt from 'bcryptjs'
import { getFileset } from '../../settings'

export const migration = {
    id: '021_seed_system_data',
    description: 'Seed all system-critical data (tags, status, config, projects, users, domains, memberships)',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 021: System data seeding...')

        // ===================================================================
        // CHAPTER 1: Seed System Tables
        // ===================================================================
        console.log('\n📖 Chapter 1: Seed System Tables')

        // -------------------------------------------------------------------
        // 1.1: Seed tags table
        // -------------------------------------------------------------------
        console.log('\n  🏷️  Seeding tags...')

        const tags = [
            {
                name: 'child',
                description: 'Content suitable for children',
                name_i18n: { de: 'Kind', cz: 'Dítě' },
                desc_i18n: { de: 'Inhalt für Kinder geeignet', cz: 'Obsah vhodný pro děti' }
            },
            {
                name: 'adult',
                description: 'Content for adults',
                name_i18n: { de: 'Erwachsene', cz: 'Dospělý' },
                desc_i18n: { de: 'Inhalt für Erwachsene', cz: 'Obsah pro dospělé' }
            },
            {
                name: 'teen',
                description: 'Content for teenagers',
                name_i18n: { de: 'Jugendliche', cz: 'Teenager' },
                desc_i18n: { de: 'Inhalt für Jugendliche', cz: 'Obsah pro teenagery' }
            },
            {
                name: 'location',
                description: 'Location-related content',
                name_i18n: { de: 'Ort', cz: 'Místo' },
                desc_i18n: { de: 'Ortsbezogener Inhalt', cz: 'Obsah související s místem' }
            }
        ]

        for (const tag of tags) {
            if (isPostgres) {
                await db.run(
                    `INSERT INTO tags (name, description, name_i18n, desc_i18n)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (name) DO NOTHING`,
                    [tag.name, tag.description, JSON.stringify(tag.name_i18n), JSON.stringify(tag.desc_i18n)]
                )
            } else {
                await db.run(
                    `INSERT OR IGNORE INTO tags (name, description, name_i18n, desc_i18n)
                     VALUES (?, ?, ?, ?)`,
                    [tag.name, tag.description, JSON.stringify(tag.name_i18n), JSON.stringify(tag.desc_i18n)]
                )
            }
        }

        console.log(`    ✓ Seeded ${tags.length} tags`)

        // -------------------------------------------------------------------
        // 1.2: Seed status table
        // -------------------------------------------------------------------
        console.log('\n  📊 Seeding status entries...')
        console.log('    ℹ️  Using bitmask structure:')
        console.log('       Bits 4-5: Record type (00=standard, 01=trash, 10=archived, 11=linked)')
        console.log('       Bits 0-3: Status value (0-15)')

        // Record type constants (bits 4-5)
        const STANDARD = 0   // 0b00000000
        const TRASH = 16  // 0b00010000
        const ARCHIVED = 32  // 0b00100000
        const LINKED = 48  // 0b00110000

        const statusEntries = [
            // Common statuses for all tables (standard record type)
            ...['projects', 'events', 'posts', 'persons', 'users'].flatMap(table => [
                {
                    table,
                    value: 0 | STANDARD,  // 0
                    name: 'new',
                    description: 'Newly created',
                    name_i18n: { de: 'Neu', cz: 'Nový' },
                    desc_i18n: { de: 'Neu erstellt', cz: 'Nově vytvořený' }
                },
                {
                    table,
                    value: 1 | STANDARD,  // 1
                    name: 'demo',
                    description: 'Demo/example data',
                    name_i18n: { de: 'Demo', cz: 'Demo' },
                    desc_i18n: { de: 'Demo-/Beispieldaten', cz: 'Demonstrační/ukázková data' }
                },
                {
                    table,
                    value: 2 | STANDARD,  // 2
                    name: 'progress',
                    description: 'Work in progress',
                    name_i18n: { de: 'In Arbeit', cz: 'Probíhá' },
                    desc_i18n: { de: 'In Bearbeitung', cz: 'Probíhající práce' }
                },
                {
                    table,
                    value: 4 | STANDARD,  // 4
                    name: 'done',
                    description: 'Completed',
                    name_i18n: { de: 'Fertig', cz: 'Hotovo' },
                    desc_i18n: { de: 'Abgeschlossen', cz: 'Dokončeno' }
                }
            ]),

            // Record type variations (trash, archived, linked) - add for each table
            ...['projects', 'events', 'posts', 'persons', 'users'].flatMap(table => [
                {
                    table,
                    value: 0 | TRASH,  // 16
                    name: 'trash',
                    description: 'In trash/deleted',
                    name_i18n: { de: 'Papierkorb', cz: 'Koš' },
                    desc_i18n: { de: 'Im Papierkorb/gelöscht', cz: 'V koši/smazáno' }
                },
                {
                    table,
                    value: 0 | ARCHIVED,  // 32
                    name: 'archived',
                    description: 'Archived',
                    name_i18n: { de: 'Archiviert', cz: 'Archivováno' },
                    desc_i18n: { de: 'Archiviert', cz: 'Archivováno' }
                },
                {
                    table,
                    value: 0 | LINKED,  // 48
                    name: 'linked',
                    description: 'Linked/referenced data',
                    name_i18n: { de: 'Verknüpft', cz: 'Propojeno' },
                    desc_i18n: { de: 'Verknüpfte/referenzierte Daten', cz: 'Propojená/odkazovaná data' }
                }
            ]),

            // Projects-specific statuses
            {
                table: 'projects',
                value: 2 | STANDARD,  // 2 (same as progress)
                name: 'draft',
                description: 'Draft version',
                name_i18n: { de: 'Entwurf', cz: 'Koncept' },
                desc_i18n: { de: 'Entwurfsversion', cz: 'Konceptová verze' }
            },
            {
                table: 'projects',
                value: 3 | STANDARD,  // 3
                name: 'publish',
                description: 'Published',
                name_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' },
                desc_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' }
            },
            {
                table: 'projects',
                value: 4 | STANDARD,  // 4 (same as done)
                name: 'released',
                description: 'Released',
                name_i18n: { de: 'Freigegeben', cz: 'Vydáno' },
                desc_i18n: { de: 'Freigegeben', cz: 'Vydáno' }
            },

            // Posts-specific statuses
            {
                table: 'posts',
                value: 2 | STANDARD,  // 2
                name: 'draft',
                description: 'Draft version',
                name_i18n: { de: 'Entwurf', cz: 'Koncept' },
                desc_i18n: { de: 'Entwurfsversion', cz: 'Konceptová verze' }
            },
            {
                table: 'posts',
                value: 3 | STANDARD,  // 3
                name: 'publish',
                description: 'Published',
                name_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' },
                desc_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' }
            },
            {
                table: 'posts',
                value: 4 | STANDARD,  // 4
                name: 'released',
                description: 'Released',
                name_i18n: { de: 'Freigegeben', cz: 'Vydáno' },
                desc_i18n: { de: 'Freigegeben', cz: 'Vydáno' }
            },

            // Events-specific statuses
            {
                table: 'events',
                value: 2 | STANDARD,  // 2
                name: 'draft',
                description: 'Draft version',
                name_i18n: { de: 'Entwurf', cz: 'Koncept' },
                desc_i18n: { de: 'Entwurfsversion', cz: 'Konceptová verze' }
            },
            {
                table: 'events',
                value: 3 | STANDARD,  // 3
                name: 'publish',
                description: 'Published',
                name_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' },
                desc_i18n: { de: 'Veröffentlicht', cz: 'Zveřejněno' }
            },
            {
                table: 'events',
                value: 4 | STANDARD,  // 4
                name: 'released',
                description: 'Released',
                name_i18n: { de: 'Freigegeben', cz: 'Vydáno' },
                desc_i18n: { de: 'Freigegeben', cz: 'Vydáno' }
            },
            {
                table: 'events',
                value: 6 | STANDARD,  // 6
                name: 'confirmed',
                description: 'Confirmed event',
                name_i18n: { de: 'Bestätigt', cz: 'Potvrzeno' },
                desc_i18n: { de: 'Bestätigte Veranstaltung', cz: 'Potvrzená událost' }
            },
            {
                table: 'events',
                value: 8 | STANDARD,  // 8
                name: 'running',
                description: 'Currently running',
                name_i18n: { de: 'Läuft', cz: 'Probíhá' },
                desc_i18n: { de: 'Läuft gerade', cz: 'Právě probíhá' }
            },
            {
                table: 'events',
                value: 9 | STANDARD,  // 9
                name: 'passed',
                description: 'Event has passed',
                name_i18n: { de: 'Vergangen', cz: 'Proběhlo' },
                desc_i18n: { de: 'Veranstaltung ist vorbei', cz: 'Událost proběhla' }
            },
            {
                table: 'events',
                value: 12 | STANDARD,  // 12
                name: 'documented',
                description: 'Documented',
                name_i18n: { de: 'Dokumentiert', cz: 'Zdokumentováno' },
                desc_i18n: { de: 'Dokumentiert', cz: 'Zdokumentováno' }
            },

            // Users-specific statuses
            {
                table: 'users',
                value: 2 | STANDARD,  // 2
                name: 'verified',
                description: 'Email verified',
                name_i18n: { de: 'Verifiziert', cz: 'Ověřeno' },
                desc_i18n: { de: 'E-Mail verifiziert', cz: 'E-mail ověřen' }
            },
            {
                table: 'users',
                value: 3 | STANDARD,  // 3
                name: 'publish',
                description: 'Public profile',
                name_i18n: { de: 'Öffentlich', cz: 'Veřejný' },
                desc_i18n: { de: 'Öffentliches Profil', cz: 'Veřejný profil' }
            },
            {
                table: 'users',
                value: 4 | STANDARD,  // 4
                name: 'synced',
                description: 'Synced with external system',
                name_i18n: { de: 'Synchronisiert', cz: 'Synchronizováno' },
                desc_i18n: { de: 'Mit externem System synchronisiert', cz: 'Synchronizováno s externím systémem' }
            },
            {
                table: 'users',
                value: 6 | STANDARD,  // 6
                name: 'public',
                description: 'Public user',
                name_i18n: { de: 'Öffentlicher Benutzer', cz: 'Veřejný uživatel' },
                desc_i18n: { de: 'Öffentlicher Benutzer', cz: 'Veřejný uživatel' }
            },

            // Persons-specific statuses
            {
                table: 'persons',
                value: 2 | STANDARD,  // 2
                name: 'active',
                description: 'Active person',
                name_i18n: { de: 'Aktiv', cz: 'Aktivní' },
                desc_i18n: { de: 'Aktive Person', cz: 'Aktivní osoba' }
            },
            {
                table: 'persons',
                value: 4 | STANDARD,  // 4
                name: 'synced',
                description: 'Synced with external system',
                name_i18n: { de: 'Synchronisiert', cz: 'Synchronizováno' },
                desc_i18n: { de: 'Mit externem System synchronisiert', cz: 'Synchronizováno s externím systémem' }
            },
            {
                table: 'persons',
                value: 6 | STANDARD,  // 6
                name: 'public',
                description: 'Public person',
                name_i18n: { de: 'Öffentlich', cz: 'Veřejný' },
                desc_i18n: { de: 'Öffentliche Person', cz: 'Veřejná osoba' }
            },
            {
                table: 'persons',
                value: 0 | ARCHIVED,  // 32
                name: 'archived',
                description: 'Archived person',
                name_i18n: { de: 'Archiviert', cz: 'Archivováno' },
                desc_i18n: { de: 'Archivierte Person', cz: 'Archivovaná osoba' }
            },
            {
                table: 'persons',
                value: 0 | TRASH,  // 16
                name: 'deleted',
                description: 'Deleted person',
                name_i18n: { de: 'Gelöscht', cz: 'Smazáno' },
                desc_i18n: { de: 'Gelöschte Person', cz: 'Smazaná osoba' }
            },

            // Tasks-specific statuses
            {
                table: 'tasks',
                value: 0 | STANDARD,  // 0
                name: 'new',
                description: 'Newly created task',
                name_i18n: { de: 'Neu', cz: 'Nový' },
                desc_i18n: { de: 'Neu erstellte Aufgabe', cz: 'Nově vytvořený úkol' }
            },
            {
                table: 'tasks',
                value: 1 | STANDARD,  // 1
                name: 'idea',
                description: 'Task idea/concept',
                name_i18n: { de: 'Idee', cz: 'Nápad' },
                desc_i18n: { de: 'Aufgaben-Idee/Konzept', cz: 'Nápad/koncept úkolu' }
            },
            {
                table: 'tasks',
                value: 2 | STANDARD,  // 2
                name: 'draft',
                description: 'Draft task',
                name_i18n: { de: 'Entwurf', cz: 'Koncept' },
                desc_i18n: { de: 'Entwurfsaufgabe', cz: 'Konceptový úkol' }
            },
            {
                table: 'tasks',
                value: 4 | STANDARD,  // 4
                name: 'active',
                description: 'Active/in-progress task',
                name_i18n: { de: 'Aktiv', cz: 'Aktivní' },
                desc_i18n: { de: 'Aktive/laufende Aufgabe', cz: 'Aktivní/probíhající úkol' }
            },
            {
                table: 'tasks',
                value: 5 | STANDARD,  // 5
                name: 'final',
                description: 'Completed task',
                name_i18n: { de: 'Abgeschlossen', cz: 'Dokončeno' },
                desc_i18n: { de: 'Abgeschlossene Aufgabe', cz: 'Dokončený úkol' }
            },
            {
                table: 'tasks',
                value: 8 | STANDARD,  // 8
                name: 'reopen',
                description: 'Reopened task',
                name_i18n: { de: 'Wiedereröffnet', cz: 'Znovu otevřeno' },
                desc_i18n: { de: 'Wiedereeröffnete Aufgabe', cz: 'Znovu otevřený úkol' }
            },
            {
                table: 'tasks',
                value: 0 | TRASH,  // 16
                name: 'trash',
                description: 'Trashed task',
                name_i18n: { de: 'Papierkorb', cz: 'Koš' },
                desc_i18n: { de: 'Gelöschte Aufgabe', cz: 'Smazaný úkol' }
            },
        ]

        let statusCount = 0
        for (const status of statusEntries) {
            if (isPostgres) {
                await db.run(
                    `INSERT INTO status (value, name, "table", description, name_i18n, desc_i18n)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (name, "table") DO UPDATE SET
                         value = EXCLUDED.value,
                         description = EXCLUDED.description,
                         name_i18n = EXCLUDED.name_i18n,
                         desc_i18n = EXCLUDED.desc_i18n`,
                    [status.value, status.name, status.table, status.description,
                    JSON.stringify(status.name_i18n), JSON.stringify(status.desc_i18n)]
                )
            } else {
                await db.run(
                    `INSERT OR REPLACE INTO status (value, name, "table", description, name_i18n, desc_i18n)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [status.value, status.name, status.table, status.description,
                    JSON.stringify(status.name_i18n), JSON.stringify(status.desc_i18n)]
                )
            }
            statusCount++
        }

        console.log(`    ✓ Seeded/updated ${statusCount} status entries`)

        // ===================================================================
        // CHAPTER 2: Seed Core System Data
        // ===================================================================
        console.log('\n📖 Chapter 2: Seed Core System Data')

        // -------------------------------------------------------------------
        // 2.1: System Config (from migration 007)
        // -------------------------------------------------------------------
        console.log('\n  ⚙️  Seeding system config...')

        // Get base fileset for watchcsv config
        const baseFileset = getFileset('base')
        const watchcsvConfig = JSON.stringify({
            base: {
                lastCheck: null,
                files: baseFileset.files
            }
        })

        if (isPostgres) {
            await db.run(
                `INSERT INTO system_config (key, value, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (key) DO NOTHING`,
                ['watchcsv', watchcsvConfig, 'Tracks last check timestamps for CSV file monitoring']
            )
        } else {
            await db.run(
                `INSERT OR IGNORE INTO system_config (key, value, description)
                 VALUES (?, ?, ?)`,
                ['watchcsv', watchcsvConfig, 'Tracks last check timestamps for CSV file monitoring']
            )
        }

        // Watchdb configuration
        const watchdbConfig = JSON.stringify({
            base: {
                lastCheck: null,
                entities: ['events', 'posts', 'locations', 'instructors', 'participants']
            }
        })

        if (isPostgres) {
            await db.run(
                `INSERT INTO system_config (key, value, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (key) DO NOTHING`,
                ['watchdb', watchdbConfig, 'Tracks last check timestamps for database entity monitoring']
            )
        } else {
            await db.run(
                `INSERT OR IGNORE INTO system_config (key, value, description)
                 VALUES (?, ?, ?)`,
                ['watchdb', watchdbConfig, 'Tracks last check timestamps for database entity monitoring']
            )
        }
        console.log('    ✓ Seeded system config (watchcsv, watchdb)')

        // -------------------------------------------------------------------
        // 2.2: Initial Projects (from migration 014)
        // -------------------------------------------------------------------
        console.log('\n  📦 Seeding initial projects...')

        // Check if 'tp' project exists
        const tpExists = await db.get('SELECT id FROM projects WHERE id = $1', ['tp'])
        if (!tpExists) {
            await db.exec(`
                INSERT INTO projects (id, heading, type, description, status)
                VALUES ('tp', 'Project Overline **tp**', 'special', 'default-page', 'active')
            `)
            console.log('    ✓ Created tp project (special)')
        } else {
            console.log('    ℹ️  tp project already exists')
        }

        // Check if 'regio1' project exists
        const regio1Exists = await db.get('SELECT id FROM projects WHERE id = $1', ['regio1'])
        if (!regio1Exists) {
            await db.exec(`
                INSERT INTO projects (id, heading, type, description, status)
                VALUES ('regio1', 'Project Overline **regio1**', 'regio', 'default-regio', 'active')
            `)
            console.log('    ✓ Created regio1 project (regio)')
        } else {
            console.log('    ℹ️  regio1 project already exists')
        }

        // -------------------------------------------------------------------
        // 2.3: TLDs and System Domains (from migration 015)
        // -------------------------------------------------------------------
        console.log('\n  🌐 Seeding TLDs and system domains...')

        // Seed TLDs
        const tlds = [
            { name: 'de', description: 'Germany', relevance: 1 },
            { name: 'com', description: 'Commercial', relevance: 1 },
            { name: 'org', description: 'Organization', relevance: 1 },
            { name: 'info', description: 'Information', relevance: 1 },
            { name: 'bayern', description: 'Bavaria', relevance: 1 },
            { name: 'eu', description: 'European Union', relevance: 1 }
        ]

        for (const tld of tlds) {
            if (isPostgres) {
                await db.run(
                    `INSERT INTO tlds (name, description, relevance) 
                     VALUES ($1, $2, $3) 
                     ON CONFLICT (name) DO NOTHING`,
                    [tld.name, tld.description, tld.relevance]
                )
            } else {
                await db.run(
                    `INSERT OR IGNORE INTO tlds (name, description, relevance) 
                     VALUES (?, ?, ?)`,
                    [tld.name, tld.description, tld.relevance]
                )
            }
        }
        console.log(`    ✓ Seeded ${tlds.length} TLDs`)

        // Seed sysdomains
        const sysdomains = [
            { domain: 'theaterpedia', tld: 'org', subdomain: null, description: 'Theaterpedia main domain', options: null },
            { domain: 'dasei', tld: 'eu', subdomain: null, description: 'Dasei domain', options: { private: true } },
            { domain: 'raumlauf', tld: 'de', subdomain: null, description: 'Raumlauf domain', options: null },
            { domain: 'brecht', tld: 'bayern', subdomain: null, description: 'Brecht Bavaria domain', options: null },
            { domain: 'crearis', tld: 'info', subdomain: null, description: 'Crearis info domain', options: { private: true } }
        ]

        for (const sysdomain of sysdomains) {
            if (isPostgres) {
                await db.run(
                    `INSERT INTO sysdomains (domain, tld, subdomain, description, options) 
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT DO NOTHING`,
                    [
                        sysdomain.domain,
                        sysdomain.tld,
                        sysdomain.subdomain,
                        sysdomain.description,
                        sysdomain.options ? JSON.stringify(sysdomain.options) : null
                    ]
                )
            } else {
                await db.run(
                    `INSERT OR IGNORE INTO sysdomains (domain, tld, subdomain, description, options) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        sysdomain.domain,
                        sysdomain.tld,
                        sysdomain.subdomain,
                        sysdomain.description,
                        sysdomain.options ? JSON.stringify(sysdomain.options) : null
                    ]
                )
            }
        }
        console.log(`    ✓ Seeded ${sysdomains.length} system domains`)

        // -------------------------------------------------------------------
        // 2.4: System Users (from migration 015)
        // -------------------------------------------------------------------
        console.log('\n  👥 Seeding system users...')

        const defaultPassword = await bcrypt.hash('password123', 10)

        // Get default status ID for 'new' status
        const newStatus = await db.get(
            `SELECT id FROM status WHERE name = $1 AND "table" = $2`,
            ['new', 'users']
        )
        const defaultStatusId = newStatus ? (newStatus as any).id : null

        const defaultUsers = [
            { sysmail: 'admin@theaterpedia.org', username: 'admin', role: 'admin' },
            { sysmail: 'base@theaterpedia.org', username: 'base', role: 'base' },
            { sysmail: 'project1@theaterpedia.org', username: 'project1', role: 'user' },
            { sysmail: 'project2@theaterpedia.org', username: 'project2', role: 'user' },
            { sysmail: 'tp@theaterpedia.org', username: 'tp', role: 'user' },
            { sysmail: 'regio1@theaterpedia.org', username: 'regio1', role: 'user' }
        ]

        for (const user of defaultUsers) {
            if (isPostgres) {
                const existing = await db.get(`SELECT id FROM users WHERE username = $1`, [user.username])
                if (!existing) {
                    await db.run(
                        `INSERT INTO users (sysmail, username, password, role, status_id, created_at) 
                         VALUES ($1, $2, $3, $4, $5, NOW())`,
                        [user.sysmail, user.username, defaultPassword, user.role, defaultStatusId]
                    )
                    console.log(`    ✓ Created user: ${user.username}`)
                } else {
                    console.log(`    ℹ️  User ${user.username} already exists`)
                }
            } else {
                await db.run(
                    `INSERT OR IGNORE INTO users (sysmail, username, password, role, status_id, created_at) 
                     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                    [user.sysmail, user.username, defaultPassword, user.role, defaultStatusId]
                )
            }
        }

        // -------------------------------------------------------------------
        // 2.5: Project Ownership (from migration 015)
        // -------------------------------------------------------------------
        console.log('\n  📦 Assigning project ownership...')

        if (isPostgres) {
            const project1User = await db.get(`SELECT id FROM users WHERE username = $1`, ['project1'])
            const project2User = await db.get(`SELECT id FROM users WHERE username = $1`, ['project2'])

            if (project1User) {
                await db.run(`UPDATE projects SET owner_id = $1 WHERE id = $2`, [(project1User as any).id, 'tp'])
                console.log(`    ✓ Set tp project owner to project1@theaterpedia.org`)
            }

            if (project2User) {
                await db.run(`UPDATE projects SET owner_id = $1 WHERE id = $2`, [(project2User as any).id, 'regio1'])
                console.log(`    ✓ Set regio1 project owner to project2@theaterpedia.org`)
            }
        } else {
            await db.run(`UPDATE projects SET owner_id = ? WHERE id = ?`, ['project1@theaterpedia.org', 'tp'])
            await db.run(`UPDATE projects SET owner_id = ? WHERE id = ?`, ['project2@theaterpedia.org', 'regio1'])
        }

        // -------------------------------------------------------------------
        // 2.6: Project Memberships (from migration 017)
        // -------------------------------------------------------------------
        console.log('\n  👥 Seeding project memberships...')

        // Get user IDs by username
        const project1User = await db.get('SELECT id FROM users WHERE username = ?', ['project1'])
        const project2User = await db.get('SELECT id FROM users WHERE username = ?', ['project2'])

        const project1UserId = project1User ? (project1User as any).id : null
        const project2UserId = project2User ? (project2User as any).id : null

        // Check if tp project exists
        const tpProject = await db.get('SELECT id FROM projects WHERE id = ?', ['tp'])
        if (tpProject && project1UserId) {
            const existingMember = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                ['tp', project1UserId]
            )
            if (!existingMember) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    ['tp', project1UserId, 'owner']
                )
                console.log('    ✓ Added project1 as member of tp')
            } else {
                console.log('    ℹ️  project1 already a member of tp')
            }
        }

        if (tpProject && project2UserId) {
            const existingMember2 = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                ['tp', project2UserId]
            )
            if (!existingMember2) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    ['tp', project2UserId, 'member']
                )
                console.log('    ✓ Added project2 as member of tp')
            } else {
                console.log('    ℹ️  project2 already a member of tp')
            }
        }

        // Check if regio1 project exists
        const regio1Project = await db.get('SELECT id FROM projects WHERE id = ?', ['regio1'])
        if (regio1Project && project2UserId) {
            const existingMember = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                ['regio1', project2UserId]
            )
            if (!existingMember) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    ['regio1', project2UserId, 'owner']
                )
                console.log('    ✓ Added project2 as member of regio1')
            } else {
                console.log('    ℹ️  project2 already a member of regio1')
            }
        }

        console.log('\n✅ Migration 021 completed: All system data seeded (tags, status, config, projects, users, domains, memberships)')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 021 down: Removing system data...')

        // Remove in reverse order
        await db.exec('DELETE FROM project_members')
        await db.exec('DELETE FROM projects WHERE id IN (\'tp\', \'regio1\')')
        await db.exec('DELETE FROM users WHERE sysmail IN (\'admin@theaterpedia.org\', \'base@theaterpedia.org\', \'project1@theaterpedia.org\', \'project2@theaterpedia.org\', \'tp@theaterpedia.org\', \'regio1@theaterpedia.org\')')
        await db.exec('DELETE FROM sysdomains')
        await db.exec('DELETE FROM tlds')
        await db.exec('DELETE FROM system_config WHERE key IN (\'watchcsv\', \'watchdb\')')
        await db.exec('DELETE FROM status')
        await db.exec('DELETE FROM tags')

        console.log('✅ Migration 021 reverted')
    }
}

export default migration
