/**
 * Migration 019: Add Tags, Status, and IDs
 * 
 * Migration Chapters:
 * - Chapter 1: Add System Tables (tags, status)
 * - Chapter 2: Migrate Users to Support Auto-ID
 * - Chapter 3: Migrate File Tables to Support Auto-ID and Status
 * - Chapter 4: Integrate Users, Participants and Instructors
 * - Chapter 5: Align Projects, Add Auto-ID
 * - Chapter 6: Align Tasks, Add Status FK
 * - Chapter 7: Align Instructors, Add header_size
 * - Chapter 8: Enable Native Tags (events, posts)
 * - Chapter 9: Surface regio_id (events, posts, instructors)
 * - Chapter 10: Block Publishing of Invalid Events
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
                    "table" TEXT NOT NULL CHECK ("table" IN ('projects', 'events', 'posts', 'persons', 'users' , 'tasks')),
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
                    "table" TEXT NOT NULL CHECK ("table" IN ('projects', 'events', 'posts', 'persons', 'users', 'tasks')),
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

        // ===================================================================
        // CHAPTER 2: Migrate Users to Support Auto-ID
        // ===================================================================
        console.log('\n📖 Chapter 2: Migrate Users to Support Auto-ID')

        // -------------------------------------------------------------------
        // 2.1: Create new users table with auto-incrementing ID
        // -------------------------------------------------------------------
        console.log('\n  👤 Migrating users table structure...')

        if (isPostgres) {
            // Step 1: Rename old users table
            await db.exec(`ALTER TABLE users RENAME TO users_old`)
            console.log('    ✓ Renamed users to users_old')

            // Step 2: Create new users table with auto-incrementing id
            await db.exec(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    sysmail TEXT NOT NULL UNIQUE CHECK (sysmail ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
                    extmail TEXT UNIQUE CHECK (extmail IS NULL OR extmail ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
                    username TEXT NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'base')),
                    status_id INTEGER REFERENCES status(id),
                    instructor_id TEXT REFERENCES instructors(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)
            console.log('    ✓ Created new users table with auto-incrementing id')

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
                const result = await db.run(
                    `INSERT INTO users (sysmail, username, password, role, status_id, instructor_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     RETURNING id`,
                    [
                        oldUser.id, // old id becomes sysmail
                        oldUser.username,
                        oldUser.password,
                        oldUser.role,
                        defaultStatusId,
                        oldUser.instructor_id,
                        oldUser.created_at,
                        oldUser.updated_at
                    ]
                )

                const newId = (result as any).id
                userIdMap[oldUser.id] = newId
                console.log(`      → Migrated user ${oldUser.username}: ${oldUser.id} → id:${newId}`)
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

            // Step 7: Update foreign key constraints to reference new id field
            // First drop old constraints, then recreate them
            await db.exec(`ALTER TABLE domains DROP CONSTRAINT IF EXISTS domains_admin_user_id_fkey`)
            await db.exec(`ALTER TABLE domains ADD CONSTRAINT domains_admin_user_id_fkey 
                          FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL`)

            await db.exec(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey`)
            await db.exec(`ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey 
                          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL`)

            await db.exec(`ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey`)
            await db.exec(`ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
                          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`)

            console.log('    ✓ Updated foreign key constraints')

            // Step 8: Drop old users table
            await db.exec(`DROP TABLE users_old`)
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
                    event_id TEXT,
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
                    event_id, type, version_id, status_id, created_at, updated_at
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
                    event_id TEXT,
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
                    event_id, version_id, status_id, multiproject, header_type, md, html, isbase,
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

            // Drop old table
            await db.exec(`DROP TABLE instructors_old`)
            console.log('    ✓ Instructors migrated to auto-ID with status_id')

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
                    event_id TEXT,
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
                    is_location_provider, event_id, version_id, status_id, project_id, isbase,
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

            // Drop old table
            await db.exec(`DROP TABLE locations_old`)
            console.log('    ✓ Locations migrated to auto-ID with status_id')

            // -------------------------------------------------------------------
            // 3.4: Update foreign key references
            // -------------------------------------------------------------------
            console.log('\n  🔗 Updating foreign key references...')

            // Note: events.public_user references instructors(id)
            // Since we renamed old ID to xmlid, we need to update this reference
            // First, check if the column exists
            const eventsColumns = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'public_user'
            `, [])

            if (eventsColumns.length > 0) {
                console.log('    → Updating events.public_user references...')

                // Create mapping table temporarily
                await db.exec(`
                    CREATE TEMPORARY TABLE instructor_id_map AS
                    SELECT xmlid AS old_id, id AS new_id
                    FROM instructors
                `)

                // Update events.public_user to use new instructor IDs
                await db.exec(`
                    UPDATE events e
                    SET public_user = m.new_id::TEXT
                    FROM instructor_id_map m
                    WHERE e.public_user = m.old_id
                `)

                // Drop temporary table
                await db.exec(`DROP TABLE instructor_id_map`)
                console.log('    ✓ Updated events.public_user references')
            }

            // Note: events.location references locations(id)
            const eventsLocationColumns = await db.all(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'location'
            `, [])

            if (eventsLocationColumns.length > 0) {
                console.log('    → Updating events.location references...')

                // Create mapping table temporarily
                await db.exec(`
                    CREATE TEMPORARY TABLE location_id_map AS
                    SELECT xmlid AS old_id, id AS new_id
                    FROM locations
                `)

                // Update events.location to use new location IDs
                await db.exec(`
                    UPDATE events e
                    SET location = m.new_id::TEXT
                    FROM location_id_map m
                    WHERE e.location = m.old_id
                `)

                // Drop temporary table
                await db.exec(`DROP TABLE location_id_map`)
                console.log('    ✓ Updated events.location references')
            }

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

            await db.exec(`
                ALTER TABLE participants 
                ADD COLUMN IF NOT EXISTS is_user BOOLEAN 
                GENERATED ALWAYS AS (
                    EXISTS (
                        SELECT 1 FROM users WHERE users.participant_id = participants.id
                    )
                ) STORED
            `)
            console.log('    ✓ Added participants.is_user computed column')

            // -------------------------------------------------------------------
            // 4.4: Add computed column is_user to instructors
            // -------------------------------------------------------------------
            console.log('\n  🎓 Adding computed column is_user to instructors...')

            await db.exec(`
                ALTER TABLE instructors 
                ADD COLUMN IF NOT EXISTS is_user BOOLEAN 
                GENERATED ALWAYS AS (
                    EXISTS (
                        SELECT 1 FROM users WHERE users.instructor_id = instructors.id
                    )
                ) STORED
            `)
            console.log('    ✓ Added instructors.is_user computed column')

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
                    status TEXT DEFAULT 'new',
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
                    domaincode, name, description, status, owner_id, created_at, updated_at,
                    header_type, header_size, md, html, type, regio, partner_projects,
                    heading, theme, cimg, teaser, team_page, cta_title, cta_form,
                    cta_entity, cta_link, is_company, config, domain_id, member_ids
                )
                SELECT 
                    p.id,  -- old id becomes domaincode
                    p.heading,  -- old heading becomes name
                    p.description,
                    p.status,
                    (SELECT u.id FROM users u WHERE u.sysmail = p.owner_id LIMIT 1),  -- Convert owner_id to new user ID
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
                await db.exec(`
                    ALTER TABLE project_members ALTER COLUMN project_id TYPE INTEGER USING (
                        SELECT m.new_id FROM project_id_map m WHERE m.old_id = project_members.project_id
                    )
                `)
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

            // Drop old projects table
            await db.exec(`DROP TABLE projects_old`)

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
                CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)
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
                            WHERE domaincode = NEW.project_id;
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
                            WHERE domaincode = OLD.project_id;
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
                    WHERE l.project_id = p.domaincode
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

            await db.exec(`ALTER TABLE tasks RENAME COLUMN status_new TO status`)
            console.log('    ✓ Renamed status_new → status')

            // -------------------------------------------------------------------
            // 6.5: Add foreign key constraint and default
            // -------------------------------------------------------------------
            console.log('\n  🔗 Adding FK constraint and default...')

            // Add NOT NULL constraint
            await db.exec(`
                ALTER TABLE tasks 
                ALTER COLUMN status SET NOT NULL
            `)
            console.log('    ✓ Added NOT NULL constraint')

            // Add default value (idea status)
            await db.exec(`
                ALTER TABLE tasks 
                ALTER COLUMN status SET DEFAULT ${ideaStatusId}
            `)
            console.log(`    ✓ Set default to idea (id=${ideaStatusId})`)

            // Add foreign key constraint
            await db.exec(`
                ALTER TABLE tasks 
                ADD CONSTRAINT tasks_status_fkey 
                FOREIGN KEY (status) REFERENCES status(id)
            `)
            console.log('    ✓ Added FK constraint to status table')

            console.log('\n✅ Chapter 6 completed: Tasks aligned with name/cimg fields and status FK')

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
            // 8.2: Create junction tables for tags
            // -------------------------------------------------------------------
            console.log('\n  🔗 Creating events_tags and posts_tags junction tables...')

            await db.exec(`
                CREATE TABLE IF NOT EXISTS events_tags (
                    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (event_id, tag_id)
                )
            `)
            console.log('    ✓ Created events_tags table')

            await db.exec(`
                CREATE TABLE IF NOT EXISTS posts_tags (
                    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (post_id, tag_id)
                )
            `)
            console.log('    ✓ Created posts_tags table')

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
            console.log('    ✓ Created indexes for tag junction tables')

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

            // Function to update events regio_id
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_events_regio()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Lookup project and get its regio field
                    NEW.regio_id = (
                        SELECT p.regio
                        FROM projects p
                        WHERE p.id::TEXT = NEW.project
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
                BEFORE INSERT OR UPDATE OF project ON events
                FOR EACH ROW
                EXECUTE FUNCTION update_events_regio();
            `)
            console.log('    ✓ Created trigger for events regio_id')

            // Function to update posts regio_id
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_posts_regio()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Lookup project and get its regio field
                    NEW.regio_id = (
                        SELECT p.regio
                        FROM projects p
                        WHERE p.id::TEXT = NEW.project
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
                BEFORE INSERT OR UPDATE OF project ON posts
                FOR EACH ROW
                EXECUTE FUNCTION update_posts_regio();
            `)
            console.log('    ✓ Created trigger for posts regio_id')

            // Function to update instructors regio_id
            await db.exec(`
                CREATE OR REPLACE FUNCTION update_instructors_regio()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Only if is_user is true
                    IF NEW.is_user = TRUE THEN
                        -- Find regio project where user is owner or member
                        NEW.regio_id = (
                            SELECT p.id
                            FROM projects p
                            WHERE p.is_regio = TRUE
                            AND (
                                p.owner_id = NEW.user_id
                                OR NEW.user_id::TEXT = ANY(
                                    SELECT jsonb_array_elements_text(p.member_ids)
                                )
                            )
                            LIMIT 1
                        );
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
                BEFORE INSERT OR UPDATE OF is_user, user_id ON instructors
                FOR EACH ROW
                EXECUTE FUNCTION update_instructors_regio();
            `)
            console.log('    ✓ Created trigger for instructors regio_id')

            // -------------------------------------------------------------------
            // 9.3: Initial population of regio_id
            // -------------------------------------------------------------------
            console.log('\n  📊 Populating initial regio_id values...')

            // Update events
            await db.exec(`
                UPDATE events e
                SET regio_id = p.regio
                FROM projects p
                WHERE p.id::TEXT = e.project
            `)
            console.log('    ✓ Populated events.regio_id')

            // Update posts
            await db.exec(`
                UPDATE posts po
                SET regio_id = p.regio
                FROM projects p
                WHERE p.id::TEXT = po.project
            `)
            console.log('    ✓ Populated posts.regio_id')

            // Update instructors
            await db.exec(`
                UPDATE instructors i
                SET regio_id = (
                    SELECT p.id
                    FROM projects p
                    WHERE p.is_regio = TRUE
                    AND (
                        p.owner_id = i.user_id
                        OR i.user_id::TEXT = ANY(
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
                    SELECT value INTO v_status_value
                    FROM status
                    WHERE id = NEW.status_id
                    LIMIT 1;

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
                BEFORE INSERT OR UPDATE OF status_id, public_user ON events
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

        console.log('\n✅ Migration 019 completed: All chapters complete - tables migrated, tags enabled, regio surfaced, and validations added')
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
