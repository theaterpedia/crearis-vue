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
        // PHASE 4: Seed some example project members (optional)
        // ===================================================================
        console.log('\n  👥 Seeding example project members...')

        // Check if tp project exists
        const tpProject = await db.get('SELECT id FROM projects WHERE id = ?', ['tp'])

        if (tpProject) {
            // Add project1 as owner (already is via owner_id, but also as member for consistency)
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

            // Add project2 as a regular member
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
            // Add project2 as owner (already is via owner_id)
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
