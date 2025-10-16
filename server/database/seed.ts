/**
 * Database Seeding Module
 * Automatically seeds database with CSV data and user/project information
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import bcrypt from 'bcryptjs'
import type { DatabaseAdapter } from './adapter'
import { getFileset, validateFileInFileset, getFilesetFilePath } from '../settings'
import { seedAdminWatchTasks } from './migrations/seed-admin-watch-tasks'

const USERS_CSV_PATH = path.resolve(process.cwd(), 'projectnames_and_users.csv')

interface UserProjectData {
    name: string
    password: string
}

/**
 * Parse CSV file
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

/**
 * Prompt for user input
 */
async function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise<string>(resolve => rl.question(question, answer => { rl.close(); resolve(answer) }))
}

/**
 * Ensure the projectnames_and_users.csv file exists.
 * If it doesn't exist, create it with default passwords.
 */
async function ensureUsersProjectsFile(): Promise<UserProjectData[]> {
    const filePath = path.join(process.cwd(), 'projectnames_and_users.csv')

    // If file exists, read and parse it
    if (fs.existsSync(filePath)) {
        console.log('� Reading projectnames_and_users.csv...')
        const csvText = fs.readFileSync(filePath, 'utf-8')
        const data = parseCSV(csvText)

        // Convert to UserProjectData format
        return data.map((row: any) => ({
            name: row.name || row.username, // Support both column names
            password: row.password || 'password123', // Default if missing
        }))
    }

    // File doesn't exist - create it with default passwords
    console.log('📝 projectnames_and_users.csv not found - creating with default passwords...')
    console.log('   Default password for all users: "password123"')
    console.log('   You can edit this file to change passwords before reseeding.\n')

    const defaultUsers = ['admin', 'base', 'project1', 'project2']
    const userData: UserProjectData[] = defaultUsers.map(name => ({
        name,
        password: 'password123'
    }))

    // Write to CSV file
    const csvContent = 'name,password\n' +
        userData.map(u => `${u.name},${u.password}`).join('\n')

    fs.writeFileSync(filePath, csvContent, 'utf-8')
    console.log(`✅ Created projectnames_and_users.csv with ${userData.length} entries\n`)

    return userData
}

/**
 * Seed users and projects
 */
async function seedUsersAndProjects(db: DatabaseAdapter, userData: UserProjectData[]) {
    console.log('👥 Seeding users and projects...')

    for (const user of userData) {
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10)

        // Generate IDs (TEXT type, so we use username as ID for simplicity)
        const userId = user.name
        const projectId = user.name

        // Insert user
        await db.run(`
            INSERT INTO users (id, username, password, role)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
                password = excluded.password,
                role = excluded.role
        `, [userId, user.name, hashedPassword, user.name === 'admin' ? 'admin' : 'user'])

        // Insert project with same name
        // Projects table has: id, username, password_hash, role, name, description, status
        await db.run(`
            INSERT INTO projects (id, username, password_hash, role, name, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
                password_hash = excluded.password_hash,
                name = excluded.name,
                description = excluded.description,
                status = excluded.status
        `, [
            projectId,
            user.name,
            hashedPassword,
            user.name === 'admin' ? 'admin' : user.name === 'base' ? 'base' : 'project',
            user.name,
            `Project for ${user.name}`,
            'active'
        ])
    }

    console.log(`   ✅ Created ${userData.length} users and projects`)
}

/**
 * Seed CSV data into database
 * @param db - Database adapter
 * @param filesetId - ID of the fileset to use (defaults to 'base')
 */
async function seedCSVData(db: DatabaseAdapter, filesetId: string = 'base') {
    console.log(`📊 Seeding CSV data from fileset '${filesetId}'...`)

    try {
        const fileset = getFileset(filesetId)
        console.log(`   Using fileset: ${fileset.name} (${fileset.path})`)

        // Read all CSV files
        const eventsCSV = fs.readFileSync(getFilesetFilePath('events.csv', filesetId), 'utf-8')
        const postsCSV = fs.readFileSync(getFilesetFilePath('posts.csv', filesetId), 'utf-8')
        const locationsCSV = fs.readFileSync(getFilesetFilePath('locations.csv', filesetId), 'utf-8')
        const instructorsCSV = fs.readFileSync(getFilesetFilePath('instructors.csv', filesetId), 'utf-8')
        const childrenCSV = fs.readFileSync(getFilesetFilePath('children.csv', filesetId), 'utf-8')
        const teensCSV = fs.readFileSync(getFilesetFilePath('teens.csv', filesetId), 'utf-8')
        const adultsCSV = fs.readFileSync(getFilesetFilePath('adults.csv', filesetId), 'utf-8')

        // Parse CSV data
        const events = parseCSV(eventsCSV)
        const posts = parseCSV(postsCSV)
        const locations = parseCSV(locationsCSV)
        const instructors = parseCSV(instructorsCSV)
        const children = parseCSV(childrenCSV)
        const teens = parseCSV(teensCSV)
        const adults = parseCSV(adultsCSV)

        // Seed events first (they are referenced by other tables)
        console.log('   📅 Seeding events...')
        for (const event of events) {
            // Determine if this is a base record (starts with _demo.)
            const isBase = event.id.startsWith('_demo.') ? 1 : 0

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
        console.log(`   ✅ Seeded ${events.length} events`)

        // Seed locations
        console.log('   📍 Seeding locations...')
        for (const location of locations) {
            const isBase = location.id.startsWith('_demo.') ? 1 : 0

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
        console.log(`   ✅ Seeded ${locations.length} locations`)

        // Seed instructors
        console.log('   👨‍🏫 Seeding instructors...')
        for (const instructor of instructors) {
            const isBase = instructor.id.startsWith('_demo.') ? 1 : 0

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
        console.log(`   ✅ Seeded ${instructors.length} instructors`)

        // Seed participants (children, teens, adults)
        console.log('   👶 Seeding participants...')
        let participantCount = 0

        for (const child of children) {
            const isBase = child.id.startsWith('_demo.') ? 1 : 0

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
            participantCount++
        }

        for (const teen of teens) {
            const isBase = teen.id.startsWith('_demo.') ? 1 : 0

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
            participantCount++
        }

        for (const adult of adults) {
            const isBase = adult.id.startsWith('_demo.') ? 1 : 0

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
            participantCount++
        }
        console.log(`   ✅ Seeded ${participantCount} participants`)

        // Seed posts
        console.log('   📰 Seeding posts...')
        for (const post of posts) {
            const isBase = post.id.startsWith('_demo.') ? 1 : 0

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
        console.log(`   ✅ Seeded ${posts.length} posts`)

        console.log('✅ CSV data seeding complete!')
    } catch (error: any) {
        console.error('❌ Error seeding CSV data:', error.message)
        throw error
    }
}

/**
 * Seed projects phase - creates releases, assigns projects to releases,
 * and creates project-specific events and posts based on templates
 */
async function seedProjects(db: DatabaseAdapter) {
    console.log('🎯 Seeding: projects phase...')

    try {
        // Step 1: Create 4 release entries
        console.log('   📦 Creating releases...')
        const releases = [
            { id: '_release.base', name: 'base', version: '0.0', version_major: 0, version_minor: 0, description: 'Base release', state: 'final' },
            { id: '_release.test', name: 'test', version: '0.1', version_major: 0, version_minor: 1, description: 'Test release', state: 'draft' },
            { id: '_release.alpha', name: 'alpha', version: '0.5', version_major: 0, version_minor: 5, description: 'Alpha release', state: 'draft' },
            { id: '_release.beta', name: 'beta', version: '0.10', version_major: 0, version_minor: 10, description: 'Beta release', state: 'draft' }
        ]

        for (const release of releases) {
            await db.run(`
                INSERT INTO releases (id, version, version_major, version_minor, description, state)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    version = excluded.version,
                    version_major = excluded.version_major,
                    version_minor = excluded.version_minor,
                    description = excluded.description,
                    state = excluded.state
            `, [release.id, release.version, release.version_major, release.version_minor, release.description, release.state])
        }
        console.log(`   ✅ Created ${releases.length} releases`)

        // Step 2: Assign projects to releases
        console.log('   🔗 Assigning projects to releases...')
        
        // Get all projects
        const projects = await db.all('SELECT id FROM projects', [])
        
        // admin and base to 'base' release, others to 'test'
        for (const project of projects as any[]) {
            const releaseId = (project.id === '_project.admin' || project.id === '_project.base') 
                ? '_release.base' 
                : '_release.test'
            
            await db.run(`
                UPDATE projects 
                SET release = ? 
                WHERE id = ?
            `, [releaseId, project.id])
        }
        console.log(`   ✅ Assigned ${projects.length} projects to releases`)

        // Step 3: Get first 2 events (templates)
        const templateEvents = await db.all('SELECT * FROM events WHERE isbase = 1 ORDER BY id LIMIT 2', [])
        console.log(`   📋 Found ${templateEvents.length} template events`)

        // Get first location and first instructor
        const firstLocation = await db.get('SELECT id FROM locations WHERE isbase = 1 ORDER BY id LIMIT 1', [])
        const firstInstructor = await db.get('SELECT id FROM instructors WHERE isbase = 1 ORDER BY id LIMIT 1', [])
        const project1 = await db.get('SELECT id FROM projects WHERE id NOT IN (\'_project.admin\', \'_project.base\') ORDER BY id LIMIT 1', [])

        if (!firstLocation || !firstInstructor || !project1) {
            console.log('   ⚠️  Missing required data for project events (location, instructor, or project)')
            return
        }

        const locationId = (firstLocation as any).id
        const instructorId = (firstInstructor as any).id
        const projectId = (project1 as any).id

        // Step 4: Copy first 2 events and create new project events
        console.log('   📅 Creating project events...')
        const newEventIds: string[] = []
        
        for (const templateEvent of templateEvents as any[]) {
            const newEventId = templateEvent.id.replace('_demo.', '_project1.')
            newEventIds.push(newEventId)

            await db.run(`
                INSERT INTO events 
                (id, name, date_begin, date_end, address_id, user_id, seats_max, cimg, header_type, rectitle, teaser, isbase, template, project, location, public_user)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    isbase = excluded.isbase,
                    template = excluded.template,
                    project = excluded.project,
                    location = excluded.location,
                    public_user = excluded.public_user
            `, [
                newEventId,
                templateEvent.name,
                templateEvent.date_begin,
                templateEvent.date_end,
                templateEvent.address_id,
                templateEvent.user_id,
                templateEvent.seats_max,
                templateEvent.cimg,
                templateEvent.header_type,
                templateEvent.rectitle,
                templateEvent.teaser,
                0, // isbase = false
                templateEvent.id, // template references original event
                projectId, // project reference
                locationId, // location reference
                instructorId // public_user reference
            ])
        }
        console.log(`   ✅ Created ${newEventIds.length} project events`)

        // Step 5: Copy first 2 posts (same logic, no locations)
        console.log('   📝 Creating project posts...')
        const templatePosts = await db.all('SELECT * FROM posts WHERE isbase = 1 ORDER BY id LIMIT 2', [])
        console.log(`   📋 Found ${templatePosts.length} template posts`)

        for (const templatePost of templatePosts as any[]) {
            const newPostId = templatePost.id.replace('_demo.', '_project1.')

            await db.run(`
                INSERT INTO posts 
                (id, name, subtitle, teaser, author_id, blog_id, tag_ids, website_published, is_published, post_date, cover_properties, event_id, cimg, isbase, template, project, public_user)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    isbase = excluded.isbase,
                    template = excluded.template,
                    project = excluded.project,
                    public_user = excluded.public_user
            `, [
                newPostId,
                templatePost.name,
                templatePost.subtitle,
                templatePost.teaser,
                templatePost.author_id,
                templatePost.blog_id,
                templatePost.tag_ids,
                templatePost.website_published,
                templatePost.is_published,
                templatePost.post_date,
                templatePost.cover_properties,
                templatePost.event_id,
                templatePost.cimg,
                0, // isbase = false
                templatePost.id, // template references original post
                projectId, // project reference
                instructorId // public_user reference
            ])
        }
        console.log(`   ✅ Created ${templatePosts.length} project posts`)

        // Step 6: Select first two teens and add project events to project_events
        console.log('   👥 Updating participants with project events...')
        const teens = await db.all('SELECT id FROM participants WHERE type = \'teen\' ORDER BY id LIMIT 2', [])
        
        if (teens.length > 0) {
            const projectEventsJson = JSON.stringify(newEventIds)
            
            for (const teen of teens as any[]) {
                await db.run(`
                    UPDATE participants 
                    SET project_events = ? 
                    WHERE id = ?
                `, [projectEventsJson, teen.id])
            }
            console.log(`   ✅ Updated ${teens.length} teen participants with project events`)
        } else {
            console.log('   ⚠️  No teen participants found')
        }

        console.log('   ✅ Projects phase seeding completed!')
    } catch (error: any) {
        console.error('   ❌ Projects phase seeding failed:', error.message)
        throw error
    }
}

/**
 * Check if database needs seeding (no data in key tables)
 */
async function needsSeeding(db: DatabaseAdapter): Promise<boolean> {
    try {
        const result = await db.get('SELECT COUNT(*) as count FROM events', [])
        return (result as any).count === 0
    } catch (error) {
        // If query fails, assume seeding is needed
        return true
    }
}

/**
 * Main seeding function
 * Called after fresh database initialization
 */
export async function seedDatabase(db: DatabaseAdapter): Promise<void> {
    // Check if seeding is needed
    const needs = await needsSeeding(db)
    if (!needs) {
        console.log('ℹ️  Database already has data - skipping seeding')
        return
    }

    console.log('\n🌱 Starting database seeding...\n')

    try {
        // Step 1: Ensure users/projects file exists and get data
        const userData = await ensureUsersProjectsFile()

        // Step 2: Seed users and projects
        await seedUsersAndProjects(db, userData)

        // Step 3: Seed CSV data
        await seedCSVData(db)

        // Step 4: Seed projects (releases, project assignments, project events/posts)
        await seedProjects(db)

        // Step 5: Seed admin watch tasks
        await seedAdminWatchTasks(db)

        console.log('\n🎉 Database seeding completed successfully!\n')
    } catch (error: any) {
        console.error('\n❌ Database seeding failed:', error.message)
        throw error
    }
}
