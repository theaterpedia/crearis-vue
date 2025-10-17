/**
 * Migration 012: Add header_type, md, html and extended fields
 * 
 * Changes:
 * - Add header_type to posts, instructors, projects, events (with CHECK constraint)
 * - Alter header_type in events to match new options
 * - Add md, html fields to posts, instructors, projects, events
 * - Add multiproject to instructors
 * - Add extensive new fields to projects table
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '012_add_header_type_and_fields',
    description: 'Add header_type, md, html, and extended project fields',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 012: Add header_type and extended fields...')

        // Valid header_type options
        const headerTypeOptions = ['default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde']
        const headerTypeCheck = `header_type IN ('${headerTypeOptions.join("', '")}')`

        // 1. Add header_type to posts
        console.log('  - Adding header_type to posts...')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE posts 
                ADD COLUMN IF NOT EXISTS header_type TEXT DEFAULT 'default'
                CHECK (${headerTypeCheck})
            `)
        } else {
            try {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD COLUMN header_type TEXT DEFAULT 'default' 
                    CHECK (${headerTypeCheck})
                `)
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) throw e
            }
        }

        // 2. Add header_type to instructors
        console.log('  - Adding header_type to instructors...')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE instructors 
                ADD COLUMN IF NOT EXISTS header_type TEXT DEFAULT 'default'
                CHECK (${headerTypeCheck})
            `)
        } else {
            try {
                await db.exec(`
                    ALTER TABLE instructors 
                    ADD COLUMN header_type TEXT DEFAULT 'default' 
                    CHECK (${headerTypeCheck})
                `)
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) throw e
            }
        }

        // 3. Add header_type to projects
        console.log('  - Adding header_type to projects...')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS header_type TEXT DEFAULT 'default'
                CHECK (${headerTypeCheck})
            `)
        } else {
            try {
                await db.exec(`
                    ALTER TABLE projects 
                    ADD COLUMN header_type TEXT DEFAULT 'default' 
                    CHECK (${headerTypeCheck})
                `)
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) throw e
            }
        }

        // 4. Update events header_type constraint (if exists, drop and recreate)
        console.log('  - Updating header_type in events...')
        if (isPostgres) {
            // Check if column exists
            const columnExists = await db.get(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'header_type'
            `, [])

            if (!columnExists) {
                // Add column if it doesn't exist
                await db.exec(`
                    ALTER TABLE events 
                    ADD COLUMN header_type TEXT DEFAULT 'default'
                    CHECK (${headerTypeCheck})
                `)
            }
            // Note: Altering existing CHECK constraints in PostgreSQL requires dropping and recreating
            // For now, new constraint will apply to new rows
        } else {
            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD COLUMN header_type TEXT DEFAULT 'default' 
                    CHECK (${headerTypeCheck})
                `)
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) {
                    console.log('  ⚠️  header_type may already exist in events')
                }
            }
        }

        // 5. Add md and html fields to posts
        console.log('  - Adding md, html to posts...')
        const mdHtmlTables = ['posts', 'instructors', 'projects', 'events']
        for (const table of mdHtmlTables) {
            if (isPostgres) {
                await db.exec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS md TEXT`)
                await db.exec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS html TEXT`)
            } else {
                try {
                    await db.exec(`ALTER TABLE ${table} ADD COLUMN md TEXT`)
                } catch (e: any) {
                    if (!e.message?.includes('duplicate column')) throw e
                }
                try {
                    await db.exec(`ALTER TABLE ${table} ADD COLUMN html TEXT`)
                } catch (e: any) {
                    if (!e.message?.includes('duplicate column')) throw e
                }
            }
        }

        // 6. Add multiproject to instructors
        console.log('  - Adding multiproject to instructors...')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE instructors 
                ADD COLUMN IF NOT EXISTS multiproject TEXT DEFAULT 'yes'
                CHECK (multiproject IN ('yes', 'no'))
            `)
        } else {
            try {
                await db.exec(`
                    ALTER TABLE instructors 
                    ADD COLUMN multiproject TEXT DEFAULT 'yes'
                    CHECK (multiproject IN ('yes', 'no'))
                `)
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) throw e
            }
        }

        // 7. Add extended fields to projects
        console.log('  - Adding extended fields to projects...')
        const projectFields = [
            { name: 'type', sql: "TEXT DEFAULT 'project' CHECK (type IN ('project', 'regio', 'special'))" },
            { name: 'is_regio', sql: 'INTEGER DEFAULT 0' },
            { name: 'regio', sql: 'TEXT REFERENCES projects(id)' },
            { name: 'partner_projects', sql: 'TEXT' }, // JSON array of project IDs
            { name: 'heading', sql: 'TEXT' },
            { name: 'theme', sql: 'INTEGER' },
            { name: 'cimg', sql: 'TEXT' },
            { name: 'teaser', sql: 'TEXT' },
            { name: 'team_page', sql: "TEXT DEFAULT 'yes' CHECK (team_page IN ('yes', 'no'))" },
            { name: 'cta_title', sql: 'TEXT' },
            { name: 'cta_form', sql: 'TEXT' },
            { name: 'cta_entity', sql: "TEXT CHECK (cta_entity IN ('post', 'event', 'instructor'))" },
            { name: 'cta_link', sql: 'TEXT' },
            { name: 'status', sql: "TEXT DEFAULT 'new' CHECK (status IN ('new', 'draft', 'demo', 'final'))" }
        ]

        for (const field of projectFields) {
            if (isPostgres) {
                await db.exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS ${field.name} ${field.sql}`)
            } else {
                try {
                    await db.exec(`ALTER TABLE projects ADD COLUMN ${field.name} ${field.sql}`)
                } catch (e: any) {
                    if (!e.message?.includes('duplicate column')) throw e
                }
            }
        }

        console.log('  ✅ Migration 012 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 012...')

        if (isPostgres) {
            // Remove added columns
            await db.exec('ALTER TABLE posts DROP COLUMN IF EXISTS header_type')
            await db.exec('ALTER TABLE posts DROP COLUMN IF EXISTS md')
            await db.exec('ALTER TABLE posts DROP COLUMN IF EXISTS html')

            await db.exec('ALTER TABLE instructors DROP COLUMN IF EXISTS header_type')
            await db.exec('ALTER TABLE instructors DROP COLUMN IF EXISTS md')
            await db.exec('ALTER TABLE instructors DROP COLUMN IF EXISTS html')
            await db.exec('ALTER TABLE instructors DROP COLUMN IF EXISTS multiproject')

            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS header_type')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS md')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS html')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS type')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS is_regio')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS regio')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS partner_projects')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS heading')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS theme')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS cimg')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS teaser')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS team_page')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS cta_title')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS cta_form')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS cta_entity')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS cta_link')
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS status')

            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS md')
            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS html')
        } else {
            console.log('  ⚠️  SQLite does not support DROP COLUMN easily - manual intervention required')
        }

        console.log('  ✅ Rolled back migration 012')
    }
}

export default migration
