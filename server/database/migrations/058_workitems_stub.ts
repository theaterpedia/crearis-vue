/**
 * Migration 058: Create Workitems Table (STUB - v0.5)
 * 
 * ⚠️  STUB MIGRATION - NOT IN INDEX
 * This migration defines the unified workitems table that will replace
 * comments (057) and provide task/activity management in v0.5.
 * 
 * Unifies four sources:
 * 1. Odoo Business Processes (mail.activity, project.task)
 * 2. Comments (Post-IT discussions, migration 057)
 * 3. Admin/Poweruser Scripts (data import, configuration)
 * 4. Existing Kanban Tasks (entity-aligned task cards)
 * 
 * Key features:
 * - Type discriminator: 'comment', 'todo', 'activity', 'process', 'script'
 * - Odoo sync fields: odoo_xmlid, odoo_model, sync_status
 * - Entity attachment: polymorphic reference to any entity
 * - Threading: parent_id for comment replies
 * - Scheduling: due_date, activity_type for Odoo activities
 * 
 * Package: G (060-069) - Odoo Integration (v0.5)
 * Target: January 2026
 * 
 * @see chat/spec/v0.5-v0.8-integration-planning.md
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '058_workitems_stub',
    description: '[STUB v0.5] Unified workitems table for tasks, comments, activities',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'
        console.log('📋 Running migration 058: Creating workitems table (v0.5 stub)...')

        // Main workitems table
        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS workitems (
                    -- Identity
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    type TEXT NOT NULL CHECK (type IN ('comment', 'todo', 'activity', 'process', 'script')),
                    
                    -- Odoo sync
                    odoo_xmlid TEXT,
                    odoo_model TEXT,
                    sync_status TEXT DEFAULT 'local' CHECK (sync_status IN ('local', 'synced', 'pending', 'conflict')),
                    sync_error TEXT,
                    synced_at TIMESTAMPTZ,
                    
                    -- Entity attachment (polymorphic)
                    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                    entity_type TEXT CHECK (entity_type IN ('post', 'project', 'event', 'image', NULL)),
                    entity_id UUID,
                    
                    -- Threading (for comments)
                    parent_id UUID REFERENCES workitems(id) ON DELETE CASCADE,
                    
                    -- Content
                    author_id UUID REFERENCES users(id),
                    assignee_id UUID REFERENCES users(id),
                    summary TEXT,
                    content TEXT,
                    
                    -- Status (aligned with sysreg bit system)
                    status INTEGER DEFAULT 1,
                    priority INTEGER DEFAULT 0,
                    
                    -- Scheduling (for activities)
                    due_date TIMESTAMPTZ,
                    activity_type TEXT,
                    
                    -- Metadata
                    is_pinned BOOLEAN DEFAULT FALSE,
                    is_resolved BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `)
        } else {
            // SQLite version
            await db.exec(`
                CREATE TABLE IF NOT EXISTS workitems (
                    -- Identity
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL CHECK (type IN ('comment', 'todo', 'activity', 'process', 'script')),
                    
                    -- Odoo sync
                    odoo_xmlid TEXT,
                    odoo_model TEXT,
                    sync_status TEXT DEFAULT 'local' CHECK (sync_status IN ('local', 'synced', 'pending', 'conflict')),
                    sync_error TEXT,
                    synced_at TEXT,
                    
                    -- Entity attachment (polymorphic)
                    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
                    entity_type TEXT CHECK (entity_type IN ('post', 'project', 'event', 'image', NULL)),
                    entity_id TEXT,
                    
                    -- Threading (for comments)
                    parent_id TEXT REFERENCES workitems(id) ON DELETE CASCADE,
                    
                    -- Content
                    author_id TEXT REFERENCES users(id),
                    assignee_id TEXT REFERENCES users(id),
                    summary TEXT,
                    content TEXT,
                    
                    -- Status (aligned with sysreg bit system)
                    status INTEGER DEFAULT 1,
                    priority INTEGER DEFAULT 0,
                    
                    -- Scheduling (for activities)
                    due_date TEXT,
                    activity_type TEXT,
                    
                    -- Metadata
                    is_pinned INTEGER DEFAULT 0,
                    is_resolved INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            `)
        }

        // Indexes
        console.log('📋 Creating workitems indexes...')

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_workitems_type 
            ON workitems(type)
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_workitems_project 
            ON workitems(project_id)
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_workitems_entity 
            ON workitems(entity_type, entity_id) 
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_workitems_parent 
            ON workitems(parent_id)
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_workitems_author 
            ON workitems(author_id)
        `)

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_workitems_assignee 
            ON workitems(assignee_id)
        `)

        // Odoo sync index - partial for efficiency
        if (isPostgres) {
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_workitems_odoo 
                ON workitems(odoo_xmlid) 
                WHERE odoo_xmlid IS NOT NULL
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_workitems_sync_pending 
                ON workitems(sync_status) 
                WHERE sync_status = 'pending'
            `)
        } else {
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_workitems_odoo 
                ON workitems(odoo_xmlid)
            `)
        }

        // Due date index for activity scheduling
        if (isPostgres) {
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_workitems_due 
                ON workitems(due_date) 
                WHERE due_date IS NOT NULL AND is_resolved = FALSE
            `)
        } else {
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_workitems_due 
                ON workitems(due_date)
            `)
        }

        // Type-specific views for backward compatibility
        console.log('📋 Creating type-specific views...')

        await db.exec(`
            CREATE VIEW IF NOT EXISTS v_comments AS 
            SELECT * FROM workitems WHERE type = 'comment'
        `)

        await db.exec(`
            CREATE VIEW IF NOT EXISTS v_todos AS 
            SELECT * FROM workitems WHERE type = 'todo'
        `)

        await db.exec(`
            CREATE VIEW IF NOT EXISTS v_activities AS 
            SELECT * FROM workitems WHERE type = 'activity'
        `)

        console.log('✅ Migration 058 complete: workitems table created')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('⬇️  Rolling back migration 058...')

        // Drop views first
        await db.exec('DROP VIEW IF EXISTS v_activities')
        await db.exec('DROP VIEW IF EXISTS v_todos')
        await db.exec('DROP VIEW IF EXISTS v_comments')

        // Drop table
        await db.exec('DROP TABLE IF EXISTS workitems')

        console.log('✅ Migration 058 rolled back')
    }
}

/**
 * Migration notes for v0.5 implementation:
 * 
 * 1. Data Migration from comments (057):
 *    - Copy comments.id → workitems.id
 *    - Set type = 'comment'
 *    - Copy all matching fields
 *    - Set sync_status = 'local'
 * 
 * 2. Odoo Sync Strategy:
 *    - mail.activity → type='activity', odoo_model='mail.activity'
 *    - project.task → type='todo' or 'process', odoo_model='project.task'
 *    - Use xmlid for unique identification
 *    - domaincode filtering on project_id
 * 
 * 3. Type Transformation:
 *    - Comments can become todos: UPDATE SET type='todo'
 *    - Same ID preserved, all relations intact
 *    - Sync to Odoo creates mail.activity
 * 
 * 4. Views vs Tables:
 *    - Views provide backward compatibility
 *    - Existing code can query v_comments
 *    - New code uses workitems directly
 */
