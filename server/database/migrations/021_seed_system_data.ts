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
import { getFileset, getDataPath } from '../../settings'
import fs from 'fs'
import path from 'path'

/**
 * Generate a random 10-character password with letters and numbers
 */
function generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * Parse CSV file (utility function)
 */
function parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n')
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

    return lines.slice(1).map(line => {
        const values: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"' && (i === 0 || line[i - 1] === ',')) {
                inQuotes = true
            } else if (char === '"' && (i === line.length - 1 || line[i + 1] === ',')) {
                inQuotes = false
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim())
                current = ''
            } else if (!(char === '"' && (i === 0 || line[i - 1] === ',' || i === line.length - 1 || line[i + 1] === ','))) {
                current += char
            }
        }
        values.push(current.trim())

        const obj: any = {}
        headers.forEach((header, index) => {
            obj[header] = values[index] || ''
        })
        return obj
    })
}

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

        // NOTE: Status entries are now seeded in migration 019 Chapter 1
        console.log('\n  ℹ️  Status entries seeded in migration 019')

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

        // Check if 'tp' project exists (using domaincode, not id)
        const tpExists = await db.get('SELECT id FROM projects WHERE domaincode = $1', ['tp'])
        if (!tpExists) {
            await db.exec(`
                INSERT INTO projects (domaincode, name, type, description, status_id)
                VALUES ('tp', 'Project Overline **tp**', 'special', 'default-page', 
                    (SELECT id FROM status WHERE name = 'done' AND "table" = 'projects' LIMIT 1))
            `)
            console.log('    ✓ Created tp project (special)')
        } else {
            console.log('    ℹ️  tp project already exists')
        }

        // Check if 'regio1' project exists (using domaincode, not id)
        const regio1Exists = await db.get('SELECT id FROM projects WHERE domaincode = $1', ['regio1'])
        if (!regio1Exists) {
            await db.exec(`
                INSERT INTO projects (domaincode, name, type, description, status_id)
                VALUES ('regio1', 'Project Overline **regio1**', 'regio', 'default-regio', 
                    (SELECT id FROM status WHERE name = 'draft' AND "table" = 'projects' LIMIT 1))
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

        // Load or create PASSWORDS.csv for system users
        const passwordsFilePath = path.join(getDataPath(), 'PASSWORDS.csv')
        const existingPasswords = new Map<string, string>()

        if (fs.existsSync(passwordsFilePath)) {
            console.log('    ℹ️  Found existing PASSWORDS.csv, loading system user entries...')
            try {
                const existingCSV = fs.readFileSync(passwordsFilePath, 'utf-8')
                const existingEntries = parseCSV(existingCSV)
                for (const entry of existingEntries) {
                    existingPasswords.set(entry.sysmail, entry.password)
                }
                console.log(`    ✓ Loaded ${existingPasswords.size} existing password entries`)
            } catch (error) {
                console.log('    ⚠️  Could not parse existing PASSWORDS.csv, will generate fresh passwords')
            }
        }

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

        const passwordEntries: Array<{ sysmail: string, extmail: string, password: string }> = []
        let newPasswordsGenerated = 0
        let reusedPasswords = 0

        for (const user of defaultUsers) {
            // Check if user already exists in database
            const existingUser = await db.get(`SELECT id FROM users WHERE sysmail = $1`, [user.sysmail])

            let plainPassword: string
            if (existingUser) {
                console.log(`    ℹ️  User ${user.username} already exists in database`)
                // Still add to CSV if we have a password
                if (existingPasswords.has(user.sysmail)) {
                    plainPassword = existingPasswords.get(user.sysmail)!
                    passwordEntries.push({
                        sysmail: user.sysmail,
                        extmail: '',
                        password: plainPassword
                    })
                    reusedPasswords++
                }
                continue
            }

            // Check if we have an existing password for this user
            if (existingPasswords.has(user.sysmail)) {
                console.log(`    ♻️  Reusing existing password for ${user.username}`)
                plainPassword = existingPasswords.get(user.sysmail)!
                reusedPasswords++
            } else {
                console.log(`    🔑 Generating new password for ${user.username}`)
                plainPassword = generateRandomPassword()
                newPasswordsGenerated++
            }

            // Add to password entries for CSV
            passwordEntries.push({
                sysmail: user.sysmail,
                extmail: '',
                password: plainPassword
            })

            // Hash password for database
            const hashedPassword = await bcrypt.hash(plainPassword, 10)

            if (isPostgres) {
                await db.run(
                    `INSERT INTO users (sysmail, username, password, role, status_id, created_at) 
                     VALUES ($1, $2, $3, $4, $5, NOW())`,
                    [user.sysmail, user.username, hashedPassword, user.role, defaultStatusId]
                )
                console.log(`    ✓ Created user: ${user.username}`)
            } else {
                await db.run(
                    `INSERT INTO users (sysmail, username, password, role, status_id, created_at) 
                     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                    [user.sysmail, user.username, hashedPassword, user.role, defaultStatusId]
                )
                console.log(`    ✓ Created user: ${user.username}`)
            }
        }

        // Update PASSWORDS.csv with system user passwords
        if (passwordEntries.length > 0) {
            // Merge with existing entries
            const allEntries = new Map<string, { sysmail: string, extmail: string, password: string }>()

            // Load all existing entries first
            if (fs.existsSync(passwordsFilePath)) {
                try {
                    const existingCSV = fs.readFileSync(passwordsFilePath, 'utf-8')
                    const existing = parseCSV(existingCSV)
                    for (const entry of existing) {
                        allEntries.set(entry.sysmail, {
                            sysmail: entry.sysmail,
                            extmail: entry.extmail || '',
                            password: entry.password
                        })
                    }
                } catch (error) {
                    console.log('    ⚠️  Error reading existing PASSWORDS.csv, will create new file')
                }
            }

            // Add/update system user entries
            for (const entry of passwordEntries) {
                allEntries.set(entry.sysmail, entry)
            }

            // Write updated CSV
            const passwordsCSVContent = [
                'sysmail,extmail,password',
                ...Array.from(allEntries.values()).map(entry =>
                    `"${entry.sysmail}","${entry.extmail}","${entry.password}"`
                )
            ].join('\n')

            fs.writeFileSync(passwordsFilePath, passwordsCSVContent, 'utf-8')
            console.log(`    ✓ Updated PASSWORDS.csv: ${newPasswordsGenerated} new, ${reusedPasswords} reused passwords`)
        }

        // -------------------------------------------------------------------
        // 2.5: Project Ownership (from migration 015)
        // -------------------------------------------------------------------
        console.log('\n  📦 Assigning project ownership...')

        if (isPostgres) {
            const project1User = await db.get(`SELECT id FROM users WHERE username = $1`, ['project1'])
            const project2User = await db.get(`SELECT id FROM users WHERE username = $1`, ['project2'])

            if (project1User) {
                await db.run(`UPDATE projects SET owner_id = $1 WHERE domaincode = $2`, [(project1User as any).id, 'tp'])
                console.log(`    ✓ Set tp project owner to project1@theaterpedia.org`)
            }

            if (project2User) {
                await db.run(`UPDATE projects SET owner_id = $1 WHERE domaincode = $2`, [(project2User as any).id, 'regio1'])
                console.log(`    ✓ Set regio1 project owner to project2@theaterpedia.org`)
            }
        } else {
            await db.run(`UPDATE projects SET owner_id = ? WHERE domaincode = ?`, ['project1@theaterpedia.org', 'tp'])
            await db.run(`UPDATE projects SET owner_id = ? WHERE domaincode = ?`, ['project2@theaterpedia.org', 'regio1'])
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
        const tpProject = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['tp'])
        if (tpProject && project1UserId) {
            const existingMember = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                [(tpProject as any).id, project1UserId]
            )
            if (!existingMember) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    [(tpProject as any).id, project1UserId, 'owner']
                )
                console.log('    ✓ Added project1 as member of tp')
            } else {
                console.log('    ℹ️  project1 already a member of tp')
            }
        }

        if (tpProject && project2UserId) {
            const existingMember2 = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                [(tpProject as any).id, project2UserId]
            )
            if (!existingMember2) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    [(tpProject as any).id, project2UserId, 'member']
                )
                console.log('    ✓ Added project2 as member of tp')
            } else {
                console.log('    ℹ️  project2 already a member of tp')
            }
        }

        // Check if regio1 project exists
        const regio1Project = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['regio1'])
        if (regio1Project && project2UserId) {
            const existingMember = await db.get(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                [(regio1Project as any).id, project2UserId]
            )
            if (!existingMember) {
                await db.run(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    [(regio1Project as any).id, project2UserId, 'owner']
                )
                console.log('    ✓ Added project2 as member of regio1')
            } else {
                console.log('    ℹ️  project2 already a member of regio1')
            }
        }

        // =================================================================
        // CHAPTER 6: Create Homepage and Teampage
        // =================================================================
        console.log('\n📄 Chapter 6: Creating Homepage and Teampage...')

        // Get tp project id
        const tpProjectForPages = await db.get('SELECT id FROM projects WHERE domaincode = $1', ['tp'])

        if (tpProjectForPages) {
            // Create Homepage (page_type: landing)
            const homepageExists = await db.get('SELECT id FROM pages WHERE project = $1 AND page_type = $2', [(tpProjectForPages as any).id, 'landing'])
            if (!homepageExists) {
                await db.run(`
                    INSERT INTO pages (project, page_type, header_type)
                    VALUES ($1, $2, $3)
                `, [(tpProjectForPages as any).id, 'landing', 'banner'])
                console.log('    ✓ Created homepage (page_type: landing) for tp project')
            } else {
                console.log('    ℹ️  Homepage already exists for tp project')
            }

            // Create Teampage (page_type: team)
            const teampageExists = await db.get('SELECT id FROM pages WHERE project = $1 AND page_type = $2', [(tpProjectForPages as any).id, 'team'])
            if (!teampageExists) {
                await db.run(`
                    INSERT INTO pages (project, page_type, header_type)
                    VALUES ($1, $2, $3)
                `, [(tpProjectForPages as any).id, 'team', 'banner'])
                console.log('    ✓ Created teampage (page_type: team) for tp project')
            } else {
                console.log('    ℹ️  Teampage already exists for tp project')
            }
        } else {
            console.log('    ⚠️  Could not find tp project for pages creation')
        }

        console.log('\n✅ Migration 021 completed: All system data seeded (tags, status, config, projects, users, domains, memberships, pages)')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 021 down: Removing system data...')

        // Remove in reverse order
        await db.exec('DELETE FROM pages WHERE project_id IN (SELECT id FROM projects WHERE domaincode IN (\'tp\', \'regio1\'))')
        await db.exec('DELETE FROM project_members')
        await db.exec('DELETE FROM projects WHERE domaincode IN (\'tp\', \'regio1\')')
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
