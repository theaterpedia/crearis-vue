/**
 * Migration 012: Add extended fields to posts, instructors, projects, and events
 * 
 * Changes:
 * - Add header_type to posts, instructors, projects, events
 * - Add md, html fields to posts, instructors, projects, events
 * - Add multiproject to instructors
 * - Add extensive project management fields to projects
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '012_add_extended_fields',
    description: 'Add header_type, md, html, and project management fields',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 012: Add extended fields...')

        // Helper function to add column
        const addColumn = async (table: string, column: string, definition: string) => {
            if (isPostgres) {
                await db.exec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`)
            } else {
                try {
                    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
                } catch (e: any) {
                    if (!e.message?.includes('duplicate column')) throw e
                }
            }
        }

        // 1. Add header_type to posts, instructors, projects
        console.log('  - Adding header_type to posts, instructors, projects...')
        const headerTypeTables = ['posts', 'instructors', 'projects']
        for (const table of headerTypeTables) {
            if (isPostgres) {
                await addColumn(
                    table,
                    'header_type',
                    "TEXT DEFAULT 'default' CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'))"
                )
            } else {
                await addColumn(
                    table,
                    'header_type',
                    "TEXT DEFAULT 'default' CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'))"
                )
            }
        }

        // 2. Alter header_type in events (might already exist from base schema)
        console.log('  - Updating header_type in events...')
        if (isPostgres) {
            // Drop existing column if it exists and recreate with new constraints
            await db.exec(`ALTER TABLE events DROP COLUMN IF EXISTS header_type`)
            await db.exec(`
                ALTER TABLE events 
                ADD COLUMN header_type TEXT DEFAULT 'default' 
                CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'))
            `)
        } else {
            // SQLite: Try to add if not exists
            try {
                await db.exec(`ALTER TABLE events ADD COLUMN header_type TEXT DEFAULT 'default' CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'))`)
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) throw e
                console.log('  ⏭️  Column events.header_type already exists')
            }
        }

        // 3. Add md and html fields to posts, instructors, projects, events
        console.log('  - Adding md and html fields...')
        const mdHtmlTables = ['posts', 'instructors', 'projects', 'events']
        for (const table of mdHtmlTables) {
            await addColumn(table, 'md', 'TEXT')
            await addColumn(table, 'html', 'TEXT')
        }

        // 4. Add multiproject to instructors
        console.log('  - Adding multiproject to instructors...')
        if (isPostgres) {
            await addColumn('instructors', 'multiproject', "TEXT DEFAULT 'yes' CHECK (multiproject IN ('yes', 'no'))")
        } else {
            await addColumn('instructors', 'multiproject', "TEXT DEFAULT 'yes' CHECK (multiproject IN ('yes', 'no'))")
        }

        // 5. Add project management fields
        console.log('  - Adding project management fields...')

        // type field
        if (isPostgres) {
            await addColumn('projects', 'type', "TEXT DEFAULT 'project' CHECK (type IN ('project', 'regio', 'special'))")
        } else {
            await addColumn('projects', 'type', "TEXT DEFAULT 'project' CHECK (type IN ('project', 'regio', 'special'))")
        }

        // is_regio boolean
        if (isPostgres) {
            await addColumn('projects', 'is_regio', 'BOOLEAN DEFAULT FALSE')
        } else {
            await addColumn('projects', 'is_regio', 'INTEGER DEFAULT 0') // SQLite uses INTEGER for boolean
        }

        // regio (references projects where is_regio = true)
        await addColumn('projects', 'regio', 'TEXT REFERENCES projects(id)')

        // partner_projects (comma-separated list or JSON)
        await addColumn('projects', 'partner_projects', 'TEXT')

        // heading
        await addColumn('projects', 'heading', 'TEXT')

        // theme (number)
        if (isPostgres) {
            await addColumn('projects', 'theme', 'INTEGER')
        } else {
            await addColumn('projects', 'theme', 'INTEGER')
        }

        // cimg
        await addColumn('projects', 'cimg', 'TEXT')

        // teaser
        await addColumn('projects', 'teaser', 'TEXT')

        // team_page
        if (isPostgres) {
            await addColumn('projects', 'team_page', "TEXT DEFAULT 'no' CHECK (team_page IN ('yes', 'no'))")
        } else {
            await addColumn('projects', 'team_page', "TEXT DEFAULT 'no' CHECK (team_page IN ('yes', 'no'))")
        }

        // CTA fields
        await addColumn('projects', 'cta_title', 'TEXT')
        await addColumn('projects', 'cta_form', 'TEXT')

        if (isPostgres) {
            await addColumn('projects', 'cta_entity', "TEXT CHECK (cta_entity IN ('post', 'event', 'instructor'))")
        } else {
            await addColumn('projects', 'cta_entity', "TEXT CHECK (cta_entity IN ('post', 'event', 'instructor'))")
        }

        await addColumn('projects', 'cta_link', 'TEXT')

        // status - Note: Don't add if already exists, as it may have different values
        // The status field might already exist from base schema
        // We're not adding CHECK constraint to avoid breaking existing data
        if (isPostgres) {
            try {
                // Check if column exists first
                const result = await db.get(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'projects' AND column_name = 'status'
                `)
                if (!result) {
                    await db.exec("ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'new'")
                }
            } catch (e: any) {
                console.log('  ℹ️  status column already exists in projects table')
            }
        } else {
            try {
                await db.exec("ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'new'")
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) throw e
            }
        }

        console.log('✅ Migration 012 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 012: Remove extended fields...')

        const dropColumn = async (table: string, column: string) => {
            if (isPostgres) {
                await db.exec(`ALTER TABLE ${table} DROP COLUMN IF EXISTS ${column}`)
            } else {
                console.log(`  ⚠️  SQLite does not support DROP COLUMN for ${table}.${column}`)
            }
        }

        // Remove header_type
        const tables = ['posts', 'instructors', 'projects', 'events']
        for (const table of tables) {
            await dropColumn(table, 'header_type')
            await dropColumn(table, 'md')
            await dropColumn(table, 'html')
        }

        // Remove instructor fields
        await dropColumn('instructors', 'multiproject')

        // Remove project fields
        const projectFields = [
            'type', 'is_regio', 'regio', 'partner_projects', 'heading', 'theme',
            'cimg', 'teaser', 'team_page', 'cta_title', 'cta_form', 'cta_entity',
            'cta_link', 'status'
        ]
        for (const field of projectFields) {
            await dropColumn('projects', field)
        }

        console.log('✅ Rolled back migration 012')
    }
}

export default migration
