/**
 * Migration 017: Project Role System Tables
 * 
 * Creates tables required for the project role management system:
 * - project_members: Tracks project team members
 * - event_instructors: Links instructors to events (if not exists)
 * 
 * These tables enable the auto-detection of project access on login.
 */

import type { DatabaseAdapter } from '../adapter'

export default {
    id: '017_project_role_tables',
    name: 'Project Role System Tables',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'
        console.log('Running migration 017: Project role system tables...')

        // ===================================================================
        // PHASE 1: Create project_members table
        // ===================================================================
        console.log('\n  📋 Creating project_members table...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS project_members (
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT DEFAULT 'member',
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (project_id, user_id),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `)

        console.log('    ✓ project_members table created')

        // ===================================================================
        // PHASE 2: Create event_instructors table (if not exists)
        // ===================================================================
        console.log('\n  📋 Creating event_instructors table (if not exists)...')

        await db.exec(`
            CREATE TABLE IF NOT EXISTS event_instructors (
                event_id TEXT NOT NULL,
                instructor_id TEXT NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (event_id, instructor_id),
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
            )
        `)

        console.log('    ✓ event_instructors table created')

        // ===================================================================
        // PHASE 3: Create indexes for performance
        // ===================================================================
        if (isPostgres) {
            console.log('\n  🔍 Creating indexes...')

            await db.exec(`CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id)`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_event_instructors_event ON event_instructors(event_id)`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_event_instructors_instructor ON event_instructors(instructor_id)`)

            console.log('    ✓ Indexes created')
        }

        // ===================================================================
        // PHASE 4: Removed Project Members Seeding (moved to migration 021)
        // ===================================================================
        console.log('\n  ℹ️  Project members seeding moved to migration 021')

        console.log('\n✅ Migration 017 completed: Project role system tables created')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 017: Project role system tables...')

        // Drop tables in reverse order (respecting foreign keys)
        await db.exec('DROP TABLE IF EXISTS event_instructors')
        await db.exec('DROP TABLE IF EXISTS project_members')

        console.log('✅ Migration 017 rolled back')
    }
}
