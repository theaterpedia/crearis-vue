/**
 * Migration 009: Add project relationships and releases
 * 
 * Changes:
 * 1. Add 'release' field to projects table
 * 2. Add 'project', 'template', 'public_user', 'location' fields to events table
 * 3. Add 'project', 'template', 'public_user' fields to posts table
 * 4. Add 'project_events' field to participants table
 * 
 * Rules:
 * - project, template, public_user, location: must be NULL if isbase=1, must NOT be NULL if isbase=0
 * - project_events: only allows events where isbase=0
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '009_add_project_relationships',
    description: 'Add project, template, and release relationships to tables',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 009: Add project relationships...')

        // 1. Add 'release' field to projects table
        console.log('  - Adding release field to projects...')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS release TEXT REFERENCES releases(id)
            `)
        } else {
            // SQLite doesn't support IF NOT EXISTS in ALTER TABLE
            try {
                await db.exec(`ALTER TABLE projects ADD COLUMN release TEXT REFERENCES releases(id)`)
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) throw e
            }
        }

        // 2. Add fields to events table
        console.log('  - Adding project, template, public_user, location fields to events...')
        
        const eventsFields = [
            { name: 'project', ref: 'projects(id)' },
            { name: 'template', ref: 'events(id)' },
            { name: 'public_user', ref: 'instructors(id)' },
            { name: 'location', ref: 'locations(id)' }
        ]

        for (const field of eventsFields) {
            if (isPostgres) {
                await db.exec(`
                    ALTER TABLE events 
                    ADD COLUMN IF NOT EXISTS ${field.name} TEXT REFERENCES ${field.ref}
                `)
            } else {
                try {
                    await db.exec(`ALTER TABLE events ADD COLUMN ${field.name} TEXT REFERENCES ${field.ref}`)
                } catch (e: any) {
                    if (!e.message?.includes('duplicate column')) throw e
                }
            }
        }

        // 3. Add fields to posts table
        console.log('  - Adding project, template, public_user fields to posts...')
        
        const postsFields = [
            { name: 'project', ref: 'projects(id)' },
            { name: 'template', ref: 'posts(id)' },
            { name: 'public_user', ref: 'instructors(id)' }
        ]

        for (const field of postsFields) {
            if (isPostgres) {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD COLUMN IF NOT EXISTS ${field.name} TEXT REFERENCES ${field.ref}
                `)
            } else {
                try {
                    await db.exec(`ALTER TABLE posts ADD COLUMN ${field.name} TEXT REFERENCES ${field.ref}`)
                } catch (e: any) {
                    if (!e.message?.includes('duplicate column')) throw e
                }
            }
        }

        // 4. Add 'project_events' field to participants table
        console.log('  - Adding project_events field to participants...')
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE participants 
                ADD COLUMN IF NOT EXISTS project_events TEXT
            `)
        } else {
            try {
                await db.exec(`ALTER TABLE participants ADD COLUMN project_events TEXT`)
            } catch (e: any) {
                if (!e.message?.includes('duplicate column')) throw e
            }
        }

        // 5. Add constraints for PostgreSQL
        if (isPostgres) {
            console.log('  - Adding CHECK constraints for isbase rules...')
            
            // Events constraints
            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD CONSTRAINT check_events_project_isbase 
                    CHECK ((isbase = 1 AND project IS NULL) OR (isbase = 0))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD CONSTRAINT check_events_template_isbase 
                    CHECK ((isbase = 1 AND template IS NULL) OR isbase = 0)
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD CONSTRAINT check_events_public_user_isbase 
                    CHECK ((isbase = 1 AND public_user IS NULL) OR (isbase = 0))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD CONSTRAINT check_events_location_isbase 
                    CHECK ((isbase = 1 AND location IS NULL) OR (isbase = 0))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD CONSTRAINT check_events_project_not_null 
                    CHECK ((isbase = 1) OR (isbase = 0 AND project IS NOT NULL))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD CONSTRAINT check_events_public_user_not_null 
                    CHECK ((isbase = 1) OR (isbase = 0 AND public_user IS NOT NULL))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE events 
                    ADD CONSTRAINT check_events_location_not_null 
                    CHECK ((isbase = 1) OR (isbase = 0 AND location IS NOT NULL))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            // Posts constraints
            try {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD CONSTRAINT check_posts_project_isbase 
                    CHECK ((isbase = 1 AND project IS NULL) OR (isbase = 0))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD CONSTRAINT check_posts_template_isbase 
                    CHECK ((isbase = 1 AND template IS NULL) OR isbase = 0)
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD CONSTRAINT check_posts_public_user_isbase 
                    CHECK ((isbase = 1 AND public_user IS NULL) OR (isbase = 0))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD CONSTRAINT check_posts_project_not_null 
                    CHECK ((isbase = 1) OR (isbase = 0 AND project IS NOT NULL))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }

            try {
                await db.exec(`
                    ALTER TABLE posts 
                    ADD CONSTRAINT check_posts_public_user_not_null 
                    CHECK ((isbase = 1) OR (isbase = 0 AND public_user IS NOT NULL))
                `)
            } catch (e: any) {
                if (!e.message?.includes('already exists')) throw e
            }
        }

        console.log('Migration 009 completed successfully!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 009...')

        if (isPostgres) {
            // Drop constraints first
            const constraints = [
                'ALTER TABLE events DROP CONSTRAINT IF EXISTS check_events_project_isbase',
                'ALTER TABLE events DROP CONSTRAINT IF EXISTS check_events_template_isbase',
                'ALTER TABLE events DROP CONSTRAINT IF EXISTS check_events_public_user_isbase',
                'ALTER TABLE events DROP CONSTRAINT IF EXISTS check_events_location_isbase',
                'ALTER TABLE events DROP CONSTRAINT IF EXISTS check_events_project_not_null',
                'ALTER TABLE events DROP CONSTRAINT IF EXISTS check_events_public_user_not_null',
                'ALTER TABLE events DROP CONSTRAINT IF EXISTS check_events_location_not_null',
                'ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_posts_project_isbase',
                'ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_posts_template_isbase',
                'ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_posts_public_user_isbase',
                'ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_posts_project_not_null',
                'ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_posts_public_user_not_null'
            ]

            for (const sql of constraints) {
                try {
                    await db.exec(sql)
                } catch (e) {
                    // Ignore errors for non-existent constraints
                }
            }

            // Drop columns
            await db.exec('ALTER TABLE projects DROP COLUMN IF EXISTS release')
            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS project')
            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS template')
            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS public_user')
            await db.exec('ALTER TABLE events DROP COLUMN IF EXISTS location')
            await db.exec('ALTER TABLE posts DROP COLUMN IF EXISTS project')
            await db.exec('ALTER TABLE posts DROP COLUMN IF EXISTS template')
            await db.exec('ALTER TABLE posts DROP COLUMN IF EXISTS public_user')
            await db.exec('ALTER TABLE participants DROP COLUMN IF EXISTS project_events')
        } else {
            // SQLite doesn't support DROP COLUMN, would need to recreate tables
            console.log('SQLite rollback not fully supported - table recreation required')
        }

        console.log('Migration 009 rolled back!')
    }
}
