/**
 * Migration 022: Seed CSV Data
 * 
 * Chapter 1: Imports core seed data from 'root' fileset (users, projects)
 * Chapter 2: Imports demo data from 'base' fileset (events, posts, locations, instructors, participants) - DEACTIVATED
 * 
 * This migration replaces the automatic CSV seeding that previously ran on startup.
 * 
 * CSV Files imported in Chapter 1 (root):
 * - users.csv
 * - projects.csv
 * 
 * CSV Files imported in Chapter 2 (base) - DEACTIVATED:
 * - events.csv
 * - posts.csv
 * - locations.csv
 * - instructors.csv
 * - participants.csv (children, teens, adults)
 * 
 * Note: This migration can be re-run safely (uses ON CONFLICT)
 */

import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import type { DatabaseAdapter } from '../adapter'
import { getFileset, getFilesetFilePath, getDataPath } from '../../settings'

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
 * Extract first name from username for password generation
 */
function extractFirstName(username: string): string {
    return username.split(' ')[0].toLowerCase()
}

export const migration = {
    id: '022_seed_csv_data',
    description: 'Import CSV data from root and base filesets',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 022: Seed CSV data...')

        // ============================================================
        // CHAPTER 0: JSON Seeding - Images Data
        // ============================================================
        console.log('\n🖼️  Chapter 0: JSON Seeding (images)')
        console.log('================================================')

        try {
            const imagesJsonPath = path.join(getDataPath(), 'images', 'root.json')

            if (fs.existsSync(imagesJsonPath)) {
                console.log(`  - Loading images from: ${imagesJsonPath}`)
                const imagesJson = fs.readFileSync(imagesJsonPath, 'utf-8')
                const images = JSON.parse(imagesJson)

                console.log(`  - Found ${images.length} images to import`)

                let imported = 0
                let skipped = 0
                let errors = 0

                for (const img of images) {
                    try {
                        // Check if image already exists by xmlid
                        const existing = await db.get('SELECT id FROM images WHERE xmlid = ?', [img.xmlid])

                        if (existing) {
                            console.log(`    ⏭️  Skipping existing image: ${img.xmlid}`)
                            skipped++
                            continue
                        }

                        // Convert geo object back to JSONB string if present
                        const geoJson = img.geo ? JSON.stringify(img.geo) : null

                        // Insert image with all 42 fields
                        if (db.type === 'postgresql') {
                            await db.run(`
                                INSERT INTO images (
                                    xmlid, name, url, fileformat, mediaformat, function, length, provider,
                                    has_video, has_audio, is_public, is_private, is_dark, is_light,
                                    domaincode, owner_id, date, geo, x, y, copyright, alt_text, title,
                                    status_id, tags, av_x, av_y, av_z, ca_x, ca_y, ca_z, he_x, he_y, he_z,
                                    created_at, updated_at
                                ) VALUES (
                                    $1, $2, $3, $4, $5, $6, $7, $8,
                                    $9, $10, $11, $12, $13, $14,
                                    $15, $16, $17, $18, $19, $20, $21, $22, $23,
                                    $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
                                    $35, $36
                                )
                                ON CONFLICT (xmlid) DO NOTHING
                            `, [
                                img.xmlid, img.name, img.url, img.fileformat, img.mediaformat,
                                img.function, img.length, img.provider,
                                img.has_video, img.has_audio, img.is_public, img.is_private,
                                img.is_dark, img.is_light,
                                img.domaincode, img.owner_id, img.date, geoJson, img.x, img.y,
                                img.copyright, img.alt_text, img.title,
                                img.status_id, img.tags, img.av_x, img.av_y, img.av_z,
                                img.ca_x, img.ca_y, img.ca_z, img.he_x, img.he_y, img.he_z,
                                img.created_at, img.updated_at
                            ])
                        } else {
                            await db.run(`
                                INSERT OR IGNORE INTO images (
                                    xmlid, name, url, fileformat, mediaformat, function, length, provider,
                                    has_video, has_audio, is_public, is_private, is_dark, is_light,
                                    domaincode, owner_id, date, geo, x, y, copyright, alt_text, title,
                                    status_id, tags, av_x, av_y, av_z, ca_x, ca_y, ca_z, he_x, he_y, he_z,
                                    created_at, updated_at
                                ) VALUES (
                                    ?, ?, ?, ?, ?, ?, ?, ?,
                                    ?, ?, ?, ?, ?, ?,
                                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                                    ?, ?
                                )
                            `, [
                                img.xmlid, img.name, img.url, img.fileformat, img.mediaformat,
                                img.function, img.length, img.provider,
                                img.has_video ? 1 : 0, img.has_audio ? 1 : 0, img.is_public ? 1 : 0,
                                img.is_private ? 1 : 0, img.is_dark ? 1 : 0, img.is_light ? 1 : 0,
                                img.domaincode, img.owner_id, img.date, geoJson, img.x, img.y,
                                img.copyright, img.alt_text, img.title,
                                img.status_id, img.tags, img.av_x, img.av_y, img.av_z,
                                img.ca_x, img.ca_y, img.ca_z, img.he_x, img.he_y, img.he_z,
                                img.created_at, img.updated_at
                            ])
                        }

                        imported++
                        if (imported % 10 === 0) {
                            console.log(`    ✓ Imported ${imported} images...`)
                        }
                    } catch (error) {
                        console.error(`    ❌ Error importing image ${img.xmlid}:`, error)
                        errors++
                    }
                }

                console.log(`  ✅ Images import complete:`)
                console.log(`     - Imported: ${imported}`)
                console.log(`     - Skipped: ${skipped}`)
                console.log(`     - Errors: ${errors}`)
            } else {
                console.log(`  ℹ️  No images JSON file found at: ${imagesJsonPath}`)
                console.log('     Skipping images import.')
            }
        } catch (error) {
            console.error('  ❌ Chapter 0 (JSON Seeding) failed:', error)
            throw error
        }

        // ============================================================
        // CHAPTER 1: Fileset 'root' - Core Seed Data (users, projects)
        // ============================================================
        console.log('\n📦 Chapter 1: Fileset "root" (users, projects)')
        console.log('================================================')

        const rootFilesetId = 'root'

        try {
            const rootFileset = getFileset(rootFilesetId)
            console.log(`  - Using fileset: ${rootFileset.name} (${rootFileset.path})`)

            // Read CSV files for root fileset
            const usersCSV = fs.readFileSync(getFilesetFilePath('users.csv', rootFilesetId), 'utf-8')
            const projectsCSV = fs.readFileSync(getFilesetFilePath('projects.csv', rootFilesetId), 'utf-8')

            // Parse CSV data
            const users = parseCSV(usersCSV)
            const projects = parseCSV(projectsCSV)

            // Generate PASSWORDS.csv with random passwords (enhanced with checks)
            console.log('  - Generating PASSWORDS.csv...')
            const passwordsFilePath = path.join(getDataPath(), 'PASSWORDS.csv')

            // Load existing passwords from CSV if it exists
            const existingPasswords = new Map<string, { extmail: string, password: string }>()
            if (fs.existsSync(passwordsFilePath)) {
                console.log('    ℹ️  Found existing PASSWORDS.csv, loading entries...')
                try {
                    const existingCSV = fs.readFileSync(passwordsFilePath, 'utf-8')
                    const existingEntries = parseCSV(existingCSV)
                    for (const entry of existingEntries) {
                        existingPasswords.set(entry.sysmail, {
                            extmail: entry.extmail || '',
                            password: entry.password
                        })
                    }
                    console.log(`    ✓ Loaded ${existingPasswords.size} existing password entries`)
                } catch (error) {
                    console.log('    ⚠️  Could not parse existing PASSWORDS.csv, proceeding with fresh generation')
                }
            }

            const passwordEntries: Array<{ sysmail: string, extmail: string, password: string }> = []
            let newPasswordsGenerated = 0
            let skippedExistingUsers = 0
            let skippedExistingPasswords = 0

            for (const user of users) {
                // Check 1: Does user already exist in database?
                const existingUser = await db.get('SELECT id FROM users WHERE sysmail = ?', [user.sysmail])
                if (existingUser) {
                    console.log(`    ⏭️  Skipping password generation for existing user: ${user.sysmail}`)
                    skippedExistingUsers++

                    // Still add to CSV if we have a password for them
                    if (existingPasswords.has(user.sysmail)) {
                        const existing = existingPasswords.get(user.sysmail)!
                        passwordEntries.push({
                            sysmail: user.sysmail,
                            extmail: existing.extmail,
                            password: existing.password
                        })
                    }
                    continue
                }

                // Check 2: Do we already have a password for this user in the CSV?
                if (existingPasswords.has(user.sysmail)) {
                    console.log(`    ♻️  Reusing existing password for user: ${user.sysmail}`)
                    const existing = existingPasswords.get(user.sysmail)!
                    passwordEntries.push({
                        sysmail: user.sysmail,
                        extmail: user.extmail || existing.extmail,
                        password: existing.password
                    })
                    skippedExistingPasswords++
                    continue
                }

                // Generate new password only if both checks pass
                const randomPassword = generateRandomPassword()
                passwordEntries.push({
                    sysmail: user.sysmail,
                    extmail: user.extmail || '',
                    password: randomPassword
                })
                newPasswordsGenerated++
                console.log(`    🔑 Generated new password for user: ${user.sysmail}`)
            }

            // Write PASSWORDS.csv - merge with existing entries to preserve system users
            const allEntries = new Map<string, { sysmail: string, extmail: string, password: string }>()

            // Load all existing entries first (including system users from migration 021)
            if (fs.existsSync(passwordsFilePath)) {
                try {
                    const existingCSV = fs.readFileSync(passwordsFilePath, 'utf-8')
                    const existingRows = existingCSV.split('\n').slice(1).filter((row: string) => row.trim())
                    for (const row of existingRows) {
                        const match = row.match(/"([^"]*)","([^"]*)","([^"]*)"/)
                        if (match) {
                            allEntries.set(match[1], {
                                sysmail: match[1],
                                extmail: match[2],
                                password: match[3]
                            })
                        }
                    }
                } catch (error) {
                    console.log('    ⚠️  Could not parse existing PASSWORDS.csv entries')
                }
            }

            // Add/update CSV user entries
            for (const entry of passwordEntries) {
                allEntries.set(entry.sysmail, entry)
            }

            const passwordsCSVContent = [
                'sysmail,extmail,password',
                ...Array.from(allEntries.values()).map(entry =>
                    `"${entry.sysmail}","${entry.extmail}","${entry.password}"`
                )
            ].join('\n')

            fs.writeFileSync(passwordsFilePath, passwordsCSVContent, 'utf-8')
            console.log(`    ✓ Updated PASSWORDS.csv: ${newPasswordsGenerated} new, ${skippedExistingUsers} existing users, ${skippedExistingPasswords} reused passwords`)

            // Build a map of plaintext passwords for hashing during user insertion
            const plaintextPasswordMap = new Map<string, string>()
            for (const entry of allEntries.values()) {
                plaintextPasswordMap.set(entry.sysmail, entry.password)
            }

            // Seed users
            console.log('  - Seeding users...')
            for (const user of users) {
                // Handle instructor_id/xmlid reference
                const instructorXmlId = user['instructor_id/xmlid'] || user.instructor_id
                let instructorId: number | null = null

                if (instructorXmlId && instructorXmlId.trim()) {
                    // Check if instructor exists by xmlid
                    const existingInstructor = await db.get(
                        'SELECT id FROM instructors WHERE xmlid = ?',
                        [instructorXmlId]
                    )

                    if (existingInstructor) {
                        // Instructor exists, use its ID
                        instructorId = existingInstructor.id
                        console.log(`    ℹ️  Linked user ${user.username} to existing instructor ${instructorXmlId}`)
                    } else {
                        // Create new instructor from user data
                        console.log(`    ℹ️  Creating new instructor for user ${user.username} with xmlid ${instructorXmlId}`)

                        // Extract first slug (dot notation) to check for regio
                        const firstSlug = instructorXmlId.split('.')[0]
                        let regioId: number | null = null

                        // Check if first slug matches a project with is_regio = true
                        const regioProject = await db.get(
                            'SELECT id FROM projects WHERE domaincode = ? AND is_regio = ?',
                            [firstSlug, db.type === 'postgresql' ? true : 1]
                        )

                        if (regioProject) {
                            regioId = regioProject.id
                            console.log(`      ✓ Found regio project '${firstSlug}' (id: ${regioId})`)
                        }

                        // Use extmail if available, fallback to sysmail
                        const instructorEmail = user.extmail && user.extmail.trim() ? user.extmail : user.sysmail

                        if (db.type === 'postgresql') {
                            const newInstructor = await db.get(`
                                INSERT INTO instructors (xmlid, name, email, regio_id, isbase)
                                VALUES ($1, $2, $3, $4, 0)
                                RETURNING id
                            `, [instructorXmlId, user.username, instructorEmail, regioId])
                            instructorId = newInstructor?.id || null
                        } else {
                            await db.run(`
                                INSERT INTO instructors (xmlid, name, email, regio_id, isbase)
                                VALUES (?, ?, ?, ?, 0)
                            `, [instructorXmlId, user.username, instructorEmail, regioId])
                            const newInstructor = await db.get(
                                'SELECT id FROM instructors WHERE xmlid = ?',
                                [instructorXmlId]
                            )
                            instructorId = newInstructor?.id || null
                        }
                    }
                }

                // Get plaintext password from PASSWORDS.csv and hash it
                const plaintextPassword = plaintextPasswordMap.get(user.sysmail)
                if (!plaintextPassword) {
                    console.error(`    ❌ No password found for user ${user.sysmail}, skipping...`)
                    continue
                }
                const hashedPassword = await bcrypt.hash(plaintextPassword, 10)

                // Handle cimg_id field - use id_nr if provided, otherwise lookup by XML key
                let cimgId: number | null = null
                const cimgIdNr = user['cimg_id/id_nr']
                const cimgIdXml = user['cimg_id/id']

                if (cimgIdNr && cimgIdNr.trim()) {
                    cimgId = parseInt(cimgIdNr)
                } else if (cimgIdXml && cimgIdXml.trim()) {
                    const imageResult = await db.get('SELECT id FROM images WHERE xmlid = ?', [cimgIdXml])
                    if (imageResult) {
                        cimgId = imageResult.id
                    }
                }

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO users 
                        (sysmail, extmail, username, password, role, lang, instructor_id, cimg_id, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                        ON CONFLICT(sysmail) DO UPDATE SET
                            extmail = EXCLUDED.extmail,
                            username = EXCLUDED.username,
                            password = EXCLUDED.password,
                            role = EXCLUDED.role,
                            lang = EXCLUDED.lang,
                            instructor_id = EXCLUDED.instructor_id,
                            cimg_id = EXCLUDED.cimg_id
                    `, [
                        user.sysmail,
                        user.extmail || null,
                        user.username,
                        hashedPassword,
                        user.role || 'user',
                        user.lang || 'de',
                        instructorId,
                        cimgId
                    ])
                } else {
                    await db.run(`
                        INSERT INTO users 
                        (sysmail, extmail, username, password, role, lang, instructor_id, cimg_id, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                        ON CONFLICT(sysmail) DO UPDATE SET
                            extmail = excluded.extmail,
                            username = excluded.username,
                            password = excluded.password,
                            role = excluded.role,
                            lang = excluded.lang,
                            instructor_id = excluded.instructor_id,
                            cimg_id = excluded.cimg_id
                    `, [
                        user.sysmail,
                        user.extmail || null,
                        user.username,
                        hashedPassword,
                        user.role || 'user',
                        user.lang || 'de',
                        instructorId,
                        cimgId
                    ])
                }
            }
            console.log(`    ✓ Seeded ${users.length} users`)

            // CHECK:base - Build owner_id lookup map (sysmail -> id) for projects
            // We need to lookup user IDs by sysmail since CSV uses sysmail references
            const ownerMap = new Map<string, any>()
            for (const user of users) {
                const dbUser = await db.get('SELECT id FROM users WHERE sysmail = ?', [user.sysmail])
                if (dbUser) {
                    ownerMap.set(user.sysmail, dbUser.id)
                }
            }

            // Seed projects
            console.log('  - Seeding projects...')
            for (const project of projects) {
                // CHECK:base - Resolve owner_id from sysmail reference
                const ownerSysmail = project['owner_id/sysmail'] || project.owner_id
                const ownerId = ownerMap.get(ownerSysmail)

                if (!ownerId) {
                    console.warn(`    ⚠️  Warning: Owner not found for project ${project.domaincode}: ${ownerSysmail}`)
                    continue
                }

                // CHECK:base - Resolve regio reference if present
                let regioId = null
                if (project['regio/domaincode']) {
                    const regioResult = await db.get('SELECT id FROM projects WHERE domaincode = ?', [project['regio/domaincode']])
                    if (regioResult) {
                        regioId = regioResult.id
                    }
                }

                // Handle cimg_id field - use id_nr if provided, otherwise lookup by XML key
                let cimgId: number | null = null
                const cimgIdNr = project['cimg_id/id_nr']
                const cimgIdXml = project['cimg_id/id']

                if (cimgIdNr && cimgIdNr.trim()) {
                    // Direct ID reference
                    cimgId = parseInt(cimgIdNr)
                } else if (cimgIdXml && cimgIdXml.trim()) {
                    // Lookup by XML key
                    const imageResult = await db.get('SELECT id FROM images WHERE xmlid = ?', [cimgIdXml])
                    if (imageResult) {
                        cimgId = imageResult.id
                    }
                }

                if (db.type === 'postgresql') {
                    // Map status text to status_id
                    const statusName = project.status || 'draft'
                    const statusResult = await db.get(
                        'SELECT id FROM status WHERE name = $1 AND "table" = $2 LIMIT 1',
                        [statusName, 'projects']
                    )
                    const statusId = statusResult ? statusResult.id : 18 // Default to 'new' if not found

                    await db.run(`
                        INSERT INTO projects 
                        (domaincode, name, heading, description, status_id, owner_id, type, regio, theme, teaser, cimg, cimg_id, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        ON CONFLICT(domaincode) DO UPDATE SET
                            name = EXCLUDED.name,
                            heading = EXCLUDED.heading,
                            description = EXCLUDED.description,
                            status_id = EXCLUDED.status_id,
                            owner_id = EXCLUDED.owner_id,
                            type = EXCLUDED.type,
                            regio = EXCLUDED.regio,
                            theme = EXCLUDED.theme,
                            teaser = EXCLUDED.teaser,
                            cimg = EXCLUDED.cimg,
                            cimg_id = EXCLUDED.cimg_id,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        project.domaincode,
                        project.name,
                        project.heading,
                        project.description,
                        statusId,
                        ownerId,
                        project.type || 'project',
                        regioId,
                        project.theme ? parseInt(project.theme) : null,
                        project.teaser,
                        project.cimg,
                        cimgId
                    ])
                } else {
                    // Map status text to status_id for SQLite
                    const statusName = project.status || 'draft'
                    const statusResult = await db.get(
                        'SELECT id FROM status WHERE name = ? AND "table" = ? LIMIT 1',
                        [statusName, 'projects']
                    )
                    const statusId = statusResult ? statusResult.id : 18 // Default to 'new' if not found

                    await db.run(`
                        INSERT INTO projects 
                        (domaincode, name, heading, description, status_id, owner_id, type, regio, theme, teaser, cimg, cimg_id, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                        ON CONFLICT(domaincode) DO UPDATE SET
                            name = excluded.name,
                            heading = excluded.heading,
                            description = excluded.description,
                            status_id = excluded.status_id,
                            owner_id = excluded.owner_id,
                            type = excluded.type,
                            regio = excluded.regio,
                            theme = excluded.theme,
                            teaser = excluded.teaser,
                            cimg = excluded.cimg,
                            cimg_id = excluded.cimg_id,
                            updated_at = datetime('now')
                    `, [
                        project.domaincode,
                        project.name,
                        project.heading,
                        project.description,
                        statusId,
                        ownerId,
                        project.type || 'project',
                        regioId,
                        project.theme ? parseInt(project.theme) : null,
                        project.teaser,
                        project.cimg,
                        cimgId
                    ])
                }
            }
            console.log(`    ✓ Seeded ${projects.length} projects`)

            console.log('\n✅ Chapter 1 completed: Root fileset seeded')

        } catch (error: any) {
            console.error(`\n❌ Error seeding root fileset: ${error.message}`)
            throw error
        }


        // ============================================================
        // CHAPTER 2: Fileset 'base' - Demo Data
        // ============================================================
        console.log('\n📦 Chapter 2: Fileset "base" (events, posts, locations, instructors, participants)')
        console.log('=================================================================================')

        const baseFilesetId = 'base'

        try {
            const fileset = getFileset(baseFilesetId)
            console.log(`  - Using fileset: ${fileset.name} (${fileset.path})`)

            // Read all CSV files
            const eventsCSV = fs.readFileSync(getFilesetFilePath('events.csv', baseFilesetId), 'utf-8')
            const postsCSV = fs.readFileSync(getFilesetFilePath('posts.csv', baseFilesetId), 'utf-8')
            const locationsCSV = fs.readFileSync(getFilesetFilePath('locations.csv', baseFilesetId), 'utf-8')
            const instructorsCSV = fs.readFileSync(getFilesetFilePath('instructors.csv', baseFilesetId), 'utf-8')
            const childrenCSV = fs.readFileSync(getFilesetFilePath('children.csv', baseFilesetId), 'utf-8')
            const teensCSV = fs.readFileSync(getFilesetFilePath('teens.csv', baseFilesetId), 'utf-8')
            const adultsCSV = fs.readFileSync(getFilesetFilePath('adults.csv', baseFilesetId), 'utf-8')

            // Parse CSV data
            const events = parseCSV(eventsCSV)
            const posts = parseCSV(postsCSV)
            const locations = parseCSV(locationsCSV)
            const instructors = parseCSV(instructorsCSV)
            const children = parseCSV(childrenCSV)
            const teens = parseCSV(teensCSV)
            const adults = parseCSV(adultsCSV)

            // CHECK:base - Helper to determine if record is base data (for isbase field)
            const isBaseRecord = (id: string) => id.startsWith('_demo.') ? 1 : 0

            // Seed locations first (may be referenced by events)
            console.log('  - Seeding locations...')
            for (const location of locations) {
                const isBase = isBaseRecord(location.id)

                // Handle cimg_id field
                let cimgId: number | null = null
                const cimgIdNr = location['cimg_id/id_nr']
                const cimgIdXml = location['cimg_id/id']

                if (cimgIdNr && cimgIdNr.trim()) {
                    cimgId = parseInt(cimgIdNr)
                } else if (cimgIdXml && cimgIdXml.trim()) {
                    const imageResult = await db.get('SELECT id FROM images WHERE xmlid = ?', [cimgIdXml])
                    if (imageResult) {
                        cimgId = imageResult.id
                    }
                }

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO locations 
                        (xmlid, name, phone, email, city, zip, street, country_id, cimg, cimg_id, header_type, md, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = EXCLUDED.name,
                            phone = EXCLUDED.phone,
                            email = EXCLUDED.email,
                            city = EXCLUDED.city,
                            zip = EXCLUDED.zip,
                            street = EXCLUDED.street,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            cimg_id = EXCLUDED.cimg_id,
                            header_type = EXCLUDED.header_type,
                            md = EXCLUDED.md,
                            isbase = EXCLUDED.isbase
                    `, [
                        location.id, // Store original TEXT id in xmlid for versioning
                        location.name,
                        location.phone,
                        location.email,
                        location.city,
                        location.zip,
                        location.street,
                        location['country_id/id'] || location.country_id,
                        location.cimg,
                        cimgId,
                        location.header_type,
                        location.md,
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO locations 
                        (xmlid, name, phone, email, city, zip, street, country_id, cimg, cimg_id, header_type, md, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = excluded.name,
                            phone = excluded.phone,
                            email = excluded.email,
                            city = excluded.city,
                            zip = excluded.zip,
                            street = excluded.street,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            cimg_id = excluded.cimg_id,
                            header_type = excluded.header_type,
                            md = excluded.md,
                            isbase = excluded.isbase
                    `, [
                        location.id,
                        location.name,
                        location.phone,
                        location.email,
                        location.city,
                        location.zip,
                        location.street,
                        location['country_id/id'] || location.country_id,
                        location.cimg,
                        cimgId,
                        location.header_type,
                        location.md,
                        isBase
                    ])
                }
            }
            console.log(`    ✓ Seeded ${locations.length} locations`)

            // Seed instructors (may be referenced by events as public_user)
            console.log('  - Seeding instructors...')
            for (const instructor of instructors) {
                const isBase = isBaseRecord(instructor.id)

                // Handle cimg_id field
                let cimgId: number | null = null
                const cimgIdNr = instructor['cimg_id/id_nr']
                const cimgIdXml = instructor['cimg_id/id']

                if (cimgIdNr && cimgIdNr.trim()) {
                    cimgId = parseInt(cimgIdNr)
                } else if (cimgIdXml && cimgIdXml.trim()) {
                    const imageResult = await db.get('SELECT id FROM images WHERE xmlid = ?', [cimgIdXml])
                    if (imageResult) {
                        cimgId = imageResult.id
                    }
                }

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO instructors 
                        (xmlid, name, email, phone, city, country_id, cimg, cimg_id, description, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = EXCLUDED.name,
                            email = EXCLUDED.email,
                            phone = EXCLUDED.phone,
                            city = EXCLUDED.city,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            cimg_id = EXCLUDED.cimg_id,
                            description = EXCLUDED.description,
                            isbase = EXCLUDED.isbase
                    `, [
                        instructor.id, // Store original TEXT id in xmlid for versioning
                        instructor.name,
                        instructor.email,
                        instructor.phone,
                        instructor.city,
                        instructor['country_id/id'] || instructor.country_id,
                        instructor.cimg,
                        cimgId,
                        instructor.description,
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO instructors 
                        (xmlid, name, email, phone, city, country_id, cimg, cimg_id, description, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = excluded.name,
                            email = excluded.email,
                            phone = excluded.phone,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            cimg_id = excluded.cimg_id,
                            description = excluded.description,
                            isbase = excluded.isbase
                    `, [
                        instructor.id,
                        instructor.name,
                        instructor.email,
                        instructor.phone,
                        instructor.city,
                        instructor['country_id/id'] || instructor.country_id,
                        instructor.cimg,
                        cimgId,
                        instructor.description,
                        isBase
                    ])
                }
            }
            console.log(`    ✓ Seeded ${instructors.length} instructors`)

            // CHECK:base - Build location lookup map (xmlid -> id) for event FK resolution
            const locationMap = new Map<string, number>()
            const allLocations = await db.all('SELECT id, xmlid FROM locations WHERE xmlid IS NOT NULL')
            for (const loc of allLocations) {
                locationMap.set(loc.xmlid, loc.id)
            }

            // Seed events
            console.log('  - Seeding events...')
            for (const event of events) {
                const isBase = isBaseRecord(event.id)

                // CHECK:base - Resolve location FK if present
                const addressXmlId = event['address_id/id'] || event.address_id
                const locationId = addressXmlId ? locationMap.get(addressXmlId) : null

                // Handle cimg_id field
                let cimgId: number | null = null
                const cimgIdNr = event['cimg_id/id_nr']
                const cimgIdXml = event['cimg_id/id']

                if (cimgIdNr && cimgIdNr.trim()) {
                    cimgId = parseInt(cimgIdNr)
                } else if (cimgIdXml && cimgIdXml.trim()) {
                    const imageResult = await db.get('SELECT id FROM images WHERE xmlid = ?', [cimgIdXml])
                    if (imageResult) {
                        cimgId = imageResult.id
                    }
                }

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO events 
                        (xmlid, name, date_begin, date_end, address_id, seats_max, cimg, cimg_id, header_type, rectitle, teaser, location, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = EXCLUDED.name,
                            date_begin = EXCLUDED.date_begin,
                            date_end = EXCLUDED.date_end,
                            address_id = EXCLUDED.address_id,
                            seats_max = EXCLUDED.seats_max,
                            cimg = EXCLUDED.cimg,
                            cimg_id = EXCLUDED.cimg_id,
                            header_type = EXCLUDED.header_type,
                            rectitle = EXCLUDED.rectitle,
                            teaser = EXCLUDED.teaser,
                            location = EXCLUDED.location,
                            isbase = EXCLUDED.isbase
                    `, [
                        event.id, // Store original TEXT id in xmlid for versioning
                        event.name,
                        event.date_begin,
                        event.date_end,
                        addressXmlId, // Keep TEXT reference in address_id for roundtripping
                        event.seats_max || null,
                        event.cimg,
                        cimgId,
                        event.header_type,
                        event.rectitle,
                        event.teaser,
                        locationId, // New INTEGER FK to locations(id)
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO events 
                        (xmlid, name, date_begin, date_end, address_id, seats_max, cimg, cimg_id, header_type, rectitle, teaser, location, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = excluded.name,
                            date_begin = excluded.date_begin,
                            date_end = excluded.date_end,
                            address_id = excluded.address_id,
                            seats_max = excluded.seats_max,
                            cimg = excluded.cimg,
                            cimg_id = excluded.cimg_id,
                            header_type = excluded.header_type,
                            rectitle = excluded.rectitle,
                            teaser = excluded.teaser,
                            location = excluded.location,
                            isbase = excluded.isbase
                    `, [
                        event.id,
                        event.name,
                        event.date_begin,
                        event.date_end,
                        addressXmlId,
                        event.seats_max || null,
                        event.cimg,
                        cimgId,
                        event.header_type,
                        event.rectitle,
                        event.teaser,
                        locationId,
                        isBase
                    ])
                }
            }
            console.log(`    ✓ Seeded ${events.length} events`)

            // Seed participants (children, teens, adults)
            console.log('  - Seeding participants...')
            let participantCount = 0

            for (const child of children) {
                const isBase = isBaseRecord(child.id)

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO participants 
                        (xmlid, name, age, city, country_id, cimg, description, type)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = EXCLUDED.name,
                            age = EXCLUDED.age,
                            city = EXCLUDED.city,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            description = EXCLUDED.description,
                            type = EXCLUDED.type
                    `, [
                        child.id, // Store original TEXT id in xmlid for versioning
                        child.name,
                        child.age || null,
                        child.city,
                        child['country_id/id'] || child.country_id,
                        child.cimg,
                        child.description,
                        'child'
                    ])
                } else {
                    await db.run(`
                        INSERT INTO participants 
                        (xmlid, name, age, city, country_id, cimg, description, type)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = excluded.name,
                            age = excluded.age,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            description = excluded.description,
                            type = excluded.type
                    `, [
                        child.id,
                        child.name,
                        child.age || null,
                        child.city,
                        child['country_id/id'] || child.country_id,
                        child.cimg,
                        child.description,
                        'child'
                    ])
                }
                participantCount++
            }

            for (const teen of teens) {
                const isBase = isBaseRecord(teen.id)

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO participants 
                        (xmlid, name, age, city, country_id, cimg, description, type)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = EXCLUDED.name,
                            age = EXCLUDED.age,
                            city = EXCLUDED.city,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            description = EXCLUDED.description,
                            type = EXCLUDED.type
                    `, [
                        teen.id,
                        teen.name,
                        teen.age || null,
                        teen.city,
                        teen['country_id/id'] || teen.country_id,
                        teen.cimg,
                        teen.description,
                        'teen'
                    ])
                } else {
                    await db.run(`
                        INSERT INTO participants 
                        (xmlid, name, age, city, country_id, cimg, description, type)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = excluded.name,
                            age = excluded.age,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            description = excluded.description,
                            type = excluded.type
                    `, [
                        teen.id,
                        teen.name,
                        teen.age || null,
                        teen.city,
                        teen['country_id/id'] || teen.country_id,
                        teen.cimg,
                        teen.description,
                        'teen'
                    ])
                }
                participantCount++
            }

            for (const adult of adults) {
                const isBase = isBaseRecord(adult.id)

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO participants 
                        (xmlid, name, age, city, country_id, cimg, description, type)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = EXCLUDED.name,
                            age = EXCLUDED.age,
                            city = EXCLUDED.city,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            description = EXCLUDED.description,
                            type = EXCLUDED.type
                    `, [
                        adult.id,
                        adult.name,
                        adult.age || null,
                        adult.city,
                        adult['country_id/id'] || adult.country_id,
                        adult.cimg,
                        adult.description,
                        'adult'
                    ])
                } else {
                    await db.run(`
                        INSERT INTO participants 
                        (xmlid, name, age, city, country_id, cimg, description, type)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = excluded.name,
                            age = excluded.age,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            description = excluded.description,
                            type = excluded.type
                    `, [
                        adult.id,
                        adult.name,
                        adult.age || null,
                        adult.city,
                        adult['country_id/id'] || adult.country_id,
                        adult.cimg,
                        adult.description,
                        'adult'
                    ])
                }
                participantCount++
            }
            console.log(`    ✓ Seeded ${participantCount} participants`)

            // Seed posts
            console.log('  - Seeding posts...')
            for (const post of posts) {
                const isBase = isBaseRecord(post.id)

                // Handle cimg_id field
                let cimgId: number | null = null
                const cimgIdNr = post['cimg_id/id_nr']
                const cimgIdXml = post['cimg_id/id']

                if (cimgIdNr && cimgIdNr.trim()) {
                    cimgId = parseInt(cimgIdNr)
                } else if (cimgIdXml && cimgIdXml.trim()) {
                    const imageResult = await db.get('SELECT id FROM images WHERE xmlid = ?', [cimgIdXml])
                    if (imageResult) {
                        cimgId = imageResult.id
                    }
                }

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO posts 
                        (xmlid, name, subtitle, teaser, author_id, blog_id, tag_ids, post_date, cimg, cimg_id, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = EXCLUDED.name,
                            subtitle = EXCLUDED.subtitle,
                            teaser = EXCLUDED.teaser,
                            author_id = EXCLUDED.author_id,
                            blog_id = EXCLUDED.blog_id,
                            tag_ids = EXCLUDED.tag_ids,
                            post_date = EXCLUDED.post_date,
                            cimg = EXCLUDED.cimg,
                            cimg_id = EXCLUDED.cimg_id,
                            isbase = EXCLUDED.isbase
                    `, [
                        post.id, // Store original TEXT id in xmlid for versioning
                        post.name,
                        post.subtitle,
                        post.teaser,
                        post['author_id/id'] || post.author_id,
                        post['blog_id/id'] || post.blog_id,
                        post['tag_ids/id'] || post.tag_ids,
                        post.post_date,
                        post.cimg,
                        cimgId,
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO posts 
                        (xmlid, name, subtitle, teaser, author_id, blog_id, tag_ids, post_date, cimg, cimg_id, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(xmlid) DO UPDATE SET
                            name = excluded.name,
                            subtitle = excluded.subtitle,
                            teaser = excluded.teaser,
                            author_id = excluded.author_id,
                            blog_id = excluded.blog_id,
                            tag_ids = excluded.tag_ids,
                            post_date = excluded.post_date,
                            cimg = excluded.cimg,
                            cimg_id = excluded.cimg_id,
                            isbase = excluded.isbase
                    `, [
                        post.id,
                        post.name,
                        post.subtitle,
                        post.teaser,
                        post['author_id/id'] || post.author_id,
                        post['blog_id/id'] || post.blog_id,
                        post['tag_ids/id'] || post.tag_ids,
                        post.post_date,
                        post.cimg,
                        cimgId,
                        isBase
                    ])
                }
            }
            console.log(`    ✓ Seeded ${posts.length} posts`)

            console.log('\n✅ Chapter 2 completed: Base fileset seeded')
        } catch (error: any) {
            console.error(`\n❌ Error seeding base fileset: ${error.message}`)
            throw error
        }

        console.log('\n✅ Migration 022 completed!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 022 down: Removing seeded data...')

        // Remove all records with isbase = 1 (base CSV data from Chapter 2)
        await db.exec('DELETE FROM posts WHERE isbase = 1')
        await db.exec('DELETE FROM participants WHERE isbase = 1')
        await db.exec('DELETE FROM instructors WHERE isbase = 1')
        await db.exec('DELETE FROM locations WHERE isbase = 1')
        await db.exec('DELETE FROM events WHERE isbase = 1')

        // Remove root fileset data (Chapter 1)
        await db.exec('DELETE FROM projects WHERE domaincode IN (SELECT domaincode FROM projects WHERE owner_id IN (SELECT id FROM users WHERE sysmail LIKE \'%@dasei.eu\' OR sysmail LIKE \'%@theaterpedia.org\'))')
        await db.exec('DELETE FROM users WHERE sysmail LIKE \'%@dasei.eu\' OR sysmail LIKE \'%@theaterpedia.org\'')

        console.log('✅ Migration 022 reverted: Seeded data removed')
    }
}

/**
 * CHECK:base - Parse CSV file (utility function)
 * This function is used by both Chapter 1 and Chapter 2
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
