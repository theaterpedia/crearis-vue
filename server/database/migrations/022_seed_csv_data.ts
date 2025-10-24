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
import type { DatabaseAdapter } from '../adapter'
import { getFileset, getFilesetFilePath } from '../../settings'

export const migration = {
    id: '022_seed_csv_data',
    description: 'Import CSV data from root and base filesets',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 022: Seed CSV data...')

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

            // Seed users
            console.log('  - Seeding users...')
            for (const user of users) {
                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO users 
                        (sysmail, username, password, role, lang, created_at)
                        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                        ON CONFLICT(sysmail) DO UPDATE SET
                            username = EXCLUDED.username,
                            password = EXCLUDED.password,
                            role = EXCLUDED.role,
                            lang = EXCLUDED.lang
                    `, [
                        user.sysmail,
                        user.username,
                        user.password,
                        user.role || 'user',
                        user.lang || 'de'
                    ])
                } else {
                    await db.run(`
                        INSERT INTO users 
                        (sysmail, username, password, role, lang, created_at)
                        VALUES (?, ?, ?, ?, ?, datetime('now'))
                        ON CONFLICT(sysmail) DO UPDATE SET
                            username = excluded.username,
                            password = excluded.password,
                            role = excluded.role,
                            lang = excluded.lang
                    `, [
                        user.sysmail,
                        user.username,
                        user.password,
                        user.role || 'user',
                        user.lang || 'de'
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

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO projects 
                        (domaincode, name, heading, description, status, owner_id, type, regio, theme, teaser, cimg, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        ON CONFLICT(domaincode) DO UPDATE SET
                            name = EXCLUDED.name,
                            heading = EXCLUDED.heading,
                            description = EXCLUDED.description,
                            status = EXCLUDED.status,
                            owner_id = EXCLUDED.owner_id,
                            type = EXCLUDED.type,
                            regio = EXCLUDED.regio,
                            theme = EXCLUDED.theme,
                            teaser = EXCLUDED.teaser,
                            cimg = EXCLUDED.cimg,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        project.domaincode,
                        project.name,
                        project.heading,
                        project.description,
                        project.status || 'draft',
                        ownerId,
                        project.type || 'project',
                        regioId,
                        project.theme ? parseInt(project.theme) : null,
                        project.teaser,
                        project.cimg
                    ])
                } else {
                    await db.run(`
                        INSERT INTO projects 
                        (domaincode, name, heading, description, status, owner_id, type, regio, theme, teaser, cimg, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                        ON CONFLICT(domaincode) DO UPDATE SET
                            name = excluded.name,
                            heading = excluded.heading,
                            description = excluded.description,
                            status = excluded.status,
                            owner_id = excluded.owner_id,
                            type = excluded.type,
                            regio = excluded.regio,
                            theme = excluded.theme,
                            teaser = excluded.teaser,
                            cimg = excluded.cimg,
                            updated_at = datetime('now')
                    `, [
                        project.domaincode,
                        project.name,
                        project.heading,
                        project.description,
                        project.status || 'draft',
                        ownerId,
                        project.type || 'project',
                        regioId,
                        project.theme ? parseInt(project.theme) : null,
                        project.teaser,
                        project.cimg
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
        // CHAPTER 2: Fileset 'base' - Demo Data (DEACTIVATED)
        // ============================================================
        console.log('\n📦 Chapter 2: Fileset "base" (events, posts, locations, instructors, participants)')
        console.log('=================================================================================')
        console.log('⚠️  DEACTIVATED - To activate, uncomment the code block below')
        console.log('⚠️  This chapter will be refactored after testing root fileset seeding')

        /* CHECK:base - DEACTIVATED Chapter 2 - Uncomment to enable base fileset seeding
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

            // Seed events first (they are referenced by other tables)
            console.log('  - Seeding events...')
            for (const event of events) {
                // Determine if this is a base record (starts with _demo.)
                const isBase = event.id.startsWith('_demo.') ? 1 : 0

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO events 
                        (id, name, date_begin, date_end, address_id, user_id, seats_max, cimg, header_type, rectitle, teaser, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        ON CONFLICT(id) DO UPDATE SET
                            name = EXCLUDED.name,
                            date_begin = EXCLUDED.date_begin,
                            date_end = EXCLUDED.date_end,
                            address_id = EXCLUDED.address_id,
                            user_id = EXCLUDED.user_id,
                            seats_max = EXCLUDED.seats_max,
                            cimg = EXCLUDED.cimg,
                            header_type = EXCLUDED.header_type,
                            rectitle = EXCLUDED.rectitle,
                            teaser = EXCLUDED.teaser,
                            isbase = EXCLUDED.isbase
                    `, [
                        event.id,
                        event.name,
                        event.date_begin,
                        event.date_end,
                        event['address_id/id'] || event.address_id,
                        event['user_id/id'] || event.user_id,
                        event.seats_max || 0,
                        event.cimg,
                        event.header_type,
                        event.rectitle,
                        event.teaser,
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO events 
                        (id, name, date_begin, date_end, address_id, user_id, seats_max, cimg, header_type, rectitle, teaser, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            date_begin = excluded.date_begin,
                            date_end = excluded.date_end,
                            address_id = excluded.address_id,
                            user_id = excluded.user_id,
                            seats_max = excluded.seats_max,
                            cimg = excluded.cimg,
                            header_type = excluded.header_type,
                            rectitle = excluded.rectitle,
                            teaser = excluded.teaser,
                            isbase = excluded.isbase
                    `, [
                        event.id,
                        event.name,
                        event.date_begin,
                        event.date_end,
                        event['address_id/id'] || event.address_id,
                        event['user_id/id'] || event.user_id,
                        event.seats_max || 0,
                        event.cimg,
                        event.header_type,
                        event.rectitle,
                        event.teaser,
                        isBase
                    ])
                }
            }
            console.log(`    ✓ Seeded ${events.length} events`)

            // Seed locations
            console.log('  - Seeding locations...')
            for (const location of locations) {
                const isBase = location.id.startsWith('_demo.') ? 1 : 0

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO locations 
                        (id, name, phone, email, city, zip, street, country_id, is_company, category_id, cimg, header_type, header_size, md, is_location_provider, event_id, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                        ON CONFLICT(id) DO UPDATE SET
                            name = EXCLUDED.name,
                            phone = EXCLUDED.phone,
                            email = EXCLUDED.email,
                            city = EXCLUDED.city,
                            zip = EXCLUDED.zip,
                            street = EXCLUDED.street,
                            country_id = EXCLUDED.country_id,
                            is_company = EXCLUDED.is_company,
                            category_id = EXCLUDED.category_id,
                            cimg = EXCLUDED.cimg,
                            header_type = EXCLUDED.header_type,
                            header_size = EXCLUDED.header_size,
                            md = EXCLUDED.md,
                            is_location_provider = EXCLUDED.is_location_provider,
                            event_id = EXCLUDED.event_id,
                            isbase = EXCLUDED.isbase
                    `, [
                        location.id,
                        location.name,
                        location.phone,
                        location.email,
                        location.city,
                        location.zip,
                        location.street,
                        location['country_id/id'] || location.country_id,
                        location.is_company,
                        location['category_id/id'] || location.category_id,
                        location.cimg,
                        location.header_type,
                        location.header_size,
                        location.md,
                        location.is_location_provider,
                        location.event_id,
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO locations 
                        (id, name, phone, email, city, zip, street, country_id, is_company, category_id, cimg, header_type, header_size, md, is_location_provider, event_id, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            phone = excluded.phone,
                            email = excluded.email,
                            city = excluded.city,
                            zip = excluded.zip,
                            street = excluded.street,
                            country_id = excluded.country_id,
                            is_company = excluded.is_company,
                            category_id = excluded.category_id,
                            cimg = excluded.cimg,
                            header_type = excluded.header_type,
                            header_size = excluded.header_size,
                            md = excluded.md,
                            is_location_provider = excluded.is_location_provider,
                            event_id = excluded.event_id,
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
                        location.is_company,
                        location['category_id/id'] || location.category_id,
                        location.cimg,
                        location.header_type,
                        location.header_size,
                        location.md,
                        location.is_location_provider,
                        location.event_id,
                        isBase
                    ])
                }
            }
            console.log(`    ✓ Seeded ${locations.length} locations`)

            // Seed instructors
            console.log('  - Seeding instructors...')
            for (const instructor of instructors) {
                const isBase = instructor.id.startsWith('_demo.') ? 1 : 0

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO instructors 
                        (id, name, email, phone, city, country_id, cimg, description, event_id, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT(id) DO UPDATE SET
                            name = EXCLUDED.name,
                            email = EXCLUDED.email,
                            phone = EXCLUDED.phone,
                            city = EXCLUDED.city,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            description = EXCLUDED.description,
                            event_id = EXCLUDED.event_id,
                            isbase = EXCLUDED.isbase
                    `, [
                        instructor.id,
                        instructor.name,
                        instructor.email,
                        instructor.phone,
                        instructor.city,
                        instructor['country_id/id'] || instructor.country_id,
                        instructor.cimg,
                        instructor.description,
                        instructor['event_id/id'] || instructor.event_id,
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO instructors 
                        (id, name, email, phone, city, country_id, cimg, description, event_id, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            email = excluded.email,
                            phone = excluded.phone,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            description = excluded.description,
                            event_id = excluded.event_id,
                            isbase = excluded.isbase
                    `, [
                        instructor.id,
                        instructor.name,
                        instructor.email,
                        instructor.phone,
                        instructor.city,
                        instructor['country_id/id'] || instructor.country_id,
                        instructor.cimg,
                        instructor.description,
                        instructor['event_id/id'] || instructor.event_id,
                        isBase
                    ])
                }
            }
            console.log(`    ✓ Seeded ${instructors.length} instructors`)

            // Seed participants (children, teens, adults)
            console.log('  - Seeding participants...')
            let participantCount = 0

            for (const child of children) {
                const isBase = child.id.startsWith('_demo.') ? 1 : 0

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO participants 
                        (id, name, age, city, country_id, cimg, description, event_id, type, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT(id) DO UPDATE SET
                            name = EXCLUDED.name,
                            age = EXCLUDED.age,
                            city = EXCLUDED.city,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            description = EXCLUDED.description,
                            event_id = EXCLUDED.event_id,
                            type = EXCLUDED.type,
                            isbase = EXCLUDED.isbase
                    `, [
                        child.id,
                        child.name,
                        child.age || null,
                        child.city,
                        child['country_id/id'] || child.country_id,
                        child.cimg,
                        child.description,
                        child['event_id/id'] || child.event_id,
                        'child',
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO participants 
                        (id, name, age, city, country_id, cimg, description, event_id, type, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            age = excluded.age,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            description = excluded.description,
                            event_id = excluded.event_id,
                            type = excluded.type,
                            isbase = excluded.isbase
                    `, [
                        child.id,
                        child.name,
                        child.age || null,
                        child.city,
                        child['country_id/id'] || child.country_id,
                        child.cimg,
                        child.description,
                        child['event_id/id'] || child.event_id,
                        'child',
                        isBase
                    ])
                }
                participantCount++
            }

            for (const teen of teens) {
                const isBase = teen.id.startsWith('_demo.') ? 1 : 0

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO participants 
                        (id, name, age, city, country_id, cimg, description, event_id, type, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT(id) DO UPDATE SET
                            name = EXCLUDED.name,
                            age = EXCLUDED.age,
                            city = EXCLUDED.city,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            description = EXCLUDED.description,
                            event_id = EXCLUDED.event_id,
                            type = EXCLUDED.type,
                            isbase = EXCLUDED.isbase
                    `, [
                        teen.id,
                        teen.name,
                        teen.age || null,
                        teen.city,
                        teen['country_id/id'] || teen.country_id,
                        teen.cimg,
                        teen.description,
                        teen['event_id/id'] || teen.event_id,
                        'teen',
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO participants 
                        (id, name, age, city, country_id, cimg, description, event_id, type, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            age = excluded.age,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            description = excluded.description,
                            event_id = excluded.event_id,
                            type = excluded.type,
                            isbase = excluded.isbase
                    `, [
                        teen.id,
                        teen.name,
                        teen.age || null,
                        teen.city,
                        teen['country_id/id'] || teen.country_id,
                        teen.cimg,
                        teen.description,
                        teen['event_id/id'] || teen.event_id,
                        'teen',
                        isBase
                    ])
                }
                participantCount++
            }

            for (const adult of adults) {
                const isBase = adult.id.startsWith('_demo.') ? 1 : 0

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO participants 
                        (id, name, age, city, country_id, cimg, description, event_id, type, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT(id) DO UPDATE SET
                            name = EXCLUDED.name,
                            age = EXCLUDED.age,
                            city = EXCLUDED.city,
                            country_id = EXCLUDED.country_id,
                            cimg = EXCLUDED.cimg,
                            description = EXCLUDED.description,
                            event_id = EXCLUDED.event_id,
                            type = EXCLUDED.type,
                            isbase = EXCLUDED.isbase
                    `, [
                        adult.id,
                        adult.name,
                        adult.age || null,
                        adult.city,
                        adult['country_id/id'] || adult.country_id,
                        adult.cimg,
                        adult.description,
                        adult['event_id/id'] || adult.event_id,
                        'adult',
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO participants 
                        (id, name, age, city, country_id, cimg, description, event_id, type, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            age = excluded.age,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            description = excluded.description,
                            event_id = excluded.event_id,
                            type = excluded.type,
                            isbase = excluded.isbase
                    `, [
                        adult.id,
                        adult.name,
                        adult.age || null,
                        adult.city,
                        adult['country_id/id'] || adult.country_id,
                        adult.cimg,
                        adult.description,
                        adult['event_id/id'] || adult.event_id,
                        'adult',
                        isBase
                    ])
                }
                participantCount++
            }
            console.log(`    ✓ Seeded ${participantCount} participants`)

            // Seed posts
            console.log('  - Seeding posts...')
            for (const post of posts) {
                const isBase = post.id.startsWith('_demo.') ? 1 : 0

                if (db.type === 'postgresql') {
                    await db.run(`
                        INSERT INTO posts 
                        (id, name, subtitle, teaser, author_id, blog_id, tag_ids, website_published, is_published, post_date, cover_properties, event_id, cimg, isbase)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                        ON CONFLICT(id) DO UPDATE SET
                            name = EXCLUDED.name,
                            subtitle = EXCLUDED.subtitle,
                            teaser = EXCLUDED.teaser,
                            author_id = EXCLUDED.author_id,
                            blog_id = EXCLUDED.blog_id,
                            tag_ids = EXCLUDED.tag_ids,
                            website_published = EXCLUDED.website_published,
                            is_published = EXCLUDED.is_published,
                            post_date = EXCLUDED.post_date,
                            cover_properties = EXCLUDED.cover_properties,
                            event_id = EXCLUDED.event_id,
                            cimg = EXCLUDED.cimg,
                            isbase = EXCLUDED.isbase
                    `, [
                        post.id,
                        post.name,
                        post.subtitle,
                        post.teaser,
                        post['author_id/id'] || post.author_id,
                        post['blog_id/id'] || post.blog_id,
                        post['tag_ids/id'] || post.tag_ids,
                        post.website_published,
                        post.is_published,
                        post.post_date,
                        post.cover_properties,
                        post['event_id/id'] || post.event_id,
                        post.cimg,
                        isBase
                    ])
                } else {
                    await db.run(`
                        INSERT INTO posts 
                        (id, name, subtitle, teaser, author_id, blog_id, tag_ids, website_published, is_published, post_date, cover_properties, event_id, cimg, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            subtitle = excluded.subtitle,
                            teaser = excluded.teaser,
                            author_id = excluded.author_id,
                            blog_id = excluded.blog_id,
                            tag_ids = excluded.tag_ids,
                            website_published = excluded.website_published,
                            is_published = excluded.is_published,
                            post_date = excluded.post_date,
                            cover_properties = excluded.cover_properties,
                            event_id = excluded.event_id,
                            cimg = excluded.cimg,
                            isbase = excluded.isbase
                    `, [
                        post.id,
                        post.name,
                        post.subtitle,
                        post.teaser,
                        post['author_id/id'] || post.author_id,
                        post['blog_id/id'] || post.blog_id,
                        post['tag_ids/id'] || post.tag_ids,
                        post.website_published,
                        post.is_published,
                        post.post_date,
                        post.cover_properties,
                        post['event_id/id'] || post.event_id,
                        post.cimg,
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
        */ // END OF DEACTIVATED CHAPTER 2

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
