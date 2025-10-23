/**
 * Migration 021: System Data Seeding
 * 
 * Consolidates all system-critical data seeding from migrations 007, 014, 015, 017.
 * This data is required for the system to function properly.
 * 
 * Seeding order (respecting dependencies):
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
    id: '021_system_data_seeding',
    description: 'Seed all system-critical data (config, projects, users, domains, memberships)',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 021: System data seeding...')

        // ===================================================================
        // STEP 1: System Config (from migration 007)
        // ===================================================================
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

        // ===================================================================
        // STEP 2: Initial Projects (from migration 014)
        // ===================================================================
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

        // ===================================================================
        // STEP 3: TLDs and System Domains (from migration 015)
        // ===================================================================
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

        // ===================================================================
        // STEP 4: System Users (from migration 015)
        // ===================================================================
        console.log('\n  👥 Seeding system users...')

        const defaultPassword = await bcrypt.hash('password123', 10)

        const defaultUsers = [
            { id: 'admin@theaterpedia.org', username: 'admin', role: 'admin' },
            { id: 'base@theaterpedia.org', username: 'base', role: 'base' },
            { id: 'project1@theaterpedia.org', username: 'project1', role: 'user' },
            { id: 'project2@theaterpedia.org', username: 'project2', role: 'user' },
            { id: 'tp@theaterpedia.org', username: 'tp', role: 'user' },
            { id: 'regio1@theaterpedia.org', username: 'regio1', role: 'user' }
        ]

        for (const user of defaultUsers) {
            if (isPostgres) {
                const existing = await db.get(`SELECT id FROM users WHERE username = $1`, [user.username])
                if (!existing) {
                    await db.run(
                        `INSERT INTO users (id, username, password, role, created_at) 
                         VALUES ($1, $2, $3, $4, NOW())`,
                        [user.id, user.username, defaultPassword, user.role]
                    )
                    console.log(`    ✓ Created user: ${user.username}`)
                } else {
                    console.log(`    ℹ️  User ${user.username} already exists`)
                }
            } else {
                await db.run(
                    `INSERT OR IGNORE INTO users (id, username, password, role, created_at) 
                     VALUES (?, ?, ?, ?, datetime('now'))`,
                    [user.id, user.username, defaultPassword, user.role]
                )
            }
        }

        // ===================================================================
        // STEP 5: Project Ownership (from migration 015)
        // ===================================================================
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

        // ===================================================================
        // STEP 6: Project Memberships (from migration 017)
        // ===================================================================
        console.log('\n  👥 Seeding project memberships...')

        // Check if tp project exists
        const tpProject = await db.get('SELECT id FROM projects WHERE id = ?', ['tp'])
        if (tpProject) {
            const existingMember = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                ['tp', 'project1@theaterpedia.org']
            )
            if (!existingMember) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    ['tp', 'project1@theaterpedia.org', 'owner']
                )
                console.log('    ✓ Added project1 as member of tp')
            } else {
                console.log('    ℹ️  project1 already a member of tp')
            }

            const existingMember2 = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                ['tp', 'project2@theaterpedia.org']
            )
            if (!existingMember2) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    ['tp', 'project2@theaterpedia.org', 'member']
                )
                console.log('    ✓ Added project2 as member of tp')
            } else {
                console.log('    ℹ️  project2 already a member of tp')
            }
        }

        // Check if regio1 project exists
        const regio1Project = await db.get('SELECT id FROM projects WHERE id = ?', ['regio1'])
        if (regio1Project) {
            const existingMember = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                ['regio1', 'project2@theaterpedia.org']
            )
            if (!existingMember) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    ['regio1', 'project2@theaterpedia.org', 'owner']
                )
                console.log('    ✓ Added project2 as member of regio1')
            } else {
                console.log('    ℹ️  project2 already a member of regio1')
            }
        }

        console.log('\n✅ Migration 021 completed: All system data seeded')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 021 down: Removing system data...')

        // Remove in reverse order
        await db.exec('DELETE FROM project_members WHERE user_id IN (\'project1@theaterpedia.org\', \'project2@theaterpedia.org\')')
        await db.exec('DELETE FROM projects WHERE id IN (\'tp\', \'regio1\')')
        await db.exec('DELETE FROM users WHERE id IN (\'admin@theaterpedia.org\', \'base@theaterpedia.org\', \'project1@theaterpedia.org\', \'project2@theaterpedia.org\', \'tp@theaterpedia.org\', \'regio1@theaterpedia.org\')')
        await db.exec('DELETE FROM sysdomains')
        await db.exec('DELETE FROM tlds')
        await db.exec('DELETE FROM system_config WHERE key IN (\'watchcsv\', \'watchdb\')')

        console.log('✅ Migration 021 reverted')
    }
}

