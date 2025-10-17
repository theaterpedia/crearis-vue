/**
 * Migration 013: Alter project status and add pages/sections/forms
 * 
 * Changes:
 * - Alter projects.status to support: new | draft | demo | active | trash
 * - Add pages table (linked to projects, auto-created on status change)
 * - Add page_sections table (linked to pages)
 * - Add form_input table (linked to projects)
 * - Add triggers for automatic page creation
 * - Add cascade delete rules
 * - Add constraint to prevent project deletion if form_input exists
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '013_alter_project_status_and_add_pages',
    description: 'Alter project status and add pages, page_sections, form_input tables',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 013: Alter project status and add pages system...')

        // 1. Alter projects.status to support new values
        console.log('  - Altering projects.status field...')
        if (isPostgres) {
            // Drop existing constraint if any
            await db.exec(`
                ALTER TABLE projects 
                DROP CONSTRAINT IF EXISTS projects_status_check
            `)
            await db.exec(`
                ALTER TABLE projects 
                DROP CONSTRAINT IF EXISTS projects_status_check1
            `)

            // Update existing 'final' to 'active' (if any exist)
            await db.exec(`
                UPDATE projects 
                SET status = 'active' 
                WHERE status = 'final'
            `)

            // Add new constraint
            await db.exec(`
                ALTER TABLE projects 
                ADD CONSTRAINT projects_status_check 
                CHECK (status IN ('new', 'draft', 'demo', 'active', 'trash'))
            `)
        } else {
            // SQLite: Would need to recreate table, skip for now
            console.log('  ⚠️  SQLite: Cannot alter CHECK constraint easily')
        }

        // 2. Create pages table
        console.log('  - Creating pages table...')
        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS pages (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    project TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    header_type TEXT DEFAULT 'simple' CHECK (header_type IN ('simple', 'columns', 'banner', 'cover', 'bauchbinde')),
                    page_type TEXT NOT NULL CHECK (page_type IN ('landing', 'event', 'post', 'team')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)
        } else {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS pages (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    project TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    header_type TEXT DEFAULT 'simple' CHECK (header_type IN ('simple', 'columns', 'banner', 'cover', 'bauchbinde')),
                    page_type TEXT NOT NULL CHECK (page_type IN ('landing', 'event', 'post', 'team')),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `)
        }

        // Create index on project for faster lookups
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_pages_project ON pages(project)
        `)

        // 3. Create page_sections table
        console.log('  - Creating page_sections table...')
        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS page_sections (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    page TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
                    scope TEXT NOT NULL CHECK (scope IN ('page', 'header', 'aside', 'bottom')),
                    type TEXT NOT NULL CHECK (type IN ('1_postit', '2_list', '3_gallery')),
                    heading TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)
        } else {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS page_sections (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    page TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
                    scope TEXT NOT NULL CHECK (scope IN ('page', 'header', 'aside', 'bottom')),
                    type TEXT NOT NULL CHECK (type IN ('1_postit', '2_list', '3_gallery')),
                    heading TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `)
        }

        // Create index on page for faster lookups
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page)
        `)

        // 4. Create form_input table
        console.log('  - Creating form_input table...')
        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS form_input (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    project TEXT NOT NULL REFERENCES projects(id),
                    name TEXT,
                    email TEXT,
                    "user" TEXT,
                    input JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)
        } else {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS form_input (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                    project TEXT NOT NULL REFERENCES projects(id),
                    name TEXT,
                    email TEXT,
                    "user" TEXT,
                    input TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `)
        }

        // Create index on project for faster lookups
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_form_input_project ON form_input(project)
        `)

        // 5. Create trigger for automatic page creation when project status changes from 'new' to 'draft'
        console.log('  - Creating trigger for automatic page creation...')
        if (isPostgres) {
            // First, create the trigger function
            await db.exec(`
                CREATE OR REPLACE FUNCTION create_project_pages()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Only create pages if status changed from 'new' to 'draft'
                    IF OLD.status = 'new' AND NEW.status = 'draft' THEN
                        -- Create landing page
                        INSERT INTO pages (project, page_type, header_type)
                        VALUES (NEW.id, 'landing', 'simple');
                        
                        -- Create event page
                        INSERT INTO pages (project, page_type, header_type)
                        VALUES (NEW.id, 'event', 'simple');
                        
                        -- Create post page
                        INSERT INTO pages (project, page_type, header_type)
                        VALUES (NEW.id, 'post', 'simple');
                        
                        -- Create team page if team_page = 'yes'
                        IF NEW.team_page = 'yes' THEN
                            INSERT INTO pages (project, page_type, header_type)
                            VALUES (NEW.id, 'team', 'simple');
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            // Create the trigger
            await db.exec(`
                DROP TRIGGER IF EXISTS trigger_create_project_pages ON projects
            `)
            await db.exec(`
                CREATE TRIGGER trigger_create_project_pages
                AFTER UPDATE ON projects
                FOR EACH ROW
                WHEN (OLD.status IS DISTINCT FROM NEW.status)
                EXECUTE FUNCTION create_project_pages()
            `)
        } else {
            // SQLite: Create trigger
            await db.exec(`
                DROP TRIGGER IF EXISTS trigger_create_project_pages
            `)
            await db.exec(`
                CREATE TRIGGER trigger_create_project_pages
                AFTER UPDATE ON projects
                FOR EACH ROW
                WHEN OLD.status = 'new' AND NEW.status = 'draft'
                BEGIN
                    INSERT INTO pages (project, page_type, header_type)
                    VALUES (NEW.id, 'landing', 'simple');
                    
                    INSERT INTO pages (project, page_type, header_type)
                    VALUES (NEW.id, 'event', 'simple');
                    
                    INSERT INTO pages (project, page_type, header_type)
                    VALUES (NEW.id, 'post', 'simple');
                    
                    INSERT INTO pages (project, page_type, header_type)
                    SELECT NEW.id, 'team', 'simple'
                    WHERE NEW.team_page = 'yes';
                END;
            `)
        }

        // 6. Create trigger to prevent project deletion if form_input exists
        console.log('  - Creating trigger to prevent project deletion with form_input...')
        if (isPostgres) {
            // Create function to check form_input before delete
            await db.exec(`
                CREATE OR REPLACE FUNCTION prevent_project_delete_with_forms()
                RETURNS TRIGGER AS $$
                DECLARE
                    form_count INTEGER;
                BEGIN
                    -- Check if there are any form_input records for this project
                    SELECT COUNT(*) INTO form_count
                    FROM form_input
                    WHERE project = OLD.id;
                    
                    IF form_count > 0 THEN
                        RAISE EXCEPTION 'Cannot delete project: % form_input record(s) exist for this project', form_count;
                    END IF;
                    
                    RETURN OLD;
                END;
                $$ LANGUAGE plpgsql;
            `)

            // Create the trigger
            await db.exec(`
                DROP TRIGGER IF EXISTS trigger_prevent_project_delete_with_forms ON projects
            `)
            await db.exec(`
                CREATE TRIGGER trigger_prevent_project_delete_with_forms
                BEFORE DELETE ON projects
                FOR EACH ROW
                EXECUTE FUNCTION prevent_project_delete_with_forms()
            `)
        } else {
            // SQLite: Create trigger
            await db.exec(`
                DROP TRIGGER IF EXISTS trigger_prevent_project_delete_with_forms
            `)
            await db.exec(`
                CREATE TRIGGER trigger_prevent_project_delete_with_forms
                BEFORE DELETE ON projects
                FOR EACH ROW
                WHEN (SELECT COUNT(*) FROM form_input WHERE project = OLD.id) > 0
                BEGIN
                    SELECT RAISE(ABORT, 'Cannot delete project: form_input records exist for this project');
                END;
            `)
        }

        console.log('✅ Migration 013 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 013: Remove pages system...')

        // Drop triggers
        if (isPostgres) {
            await db.exec(`DROP TRIGGER IF EXISTS trigger_prevent_project_delete_with_forms ON projects`)
            await db.exec(`DROP TRIGGER IF EXISTS trigger_create_project_pages ON projects`)
            await db.exec(`DROP FUNCTION IF EXISTS prevent_project_delete_with_forms()`)
            await db.exec(`DROP FUNCTION IF EXISTS create_project_pages()`)
        } else {
            await db.exec(`DROP TRIGGER IF EXISTS trigger_prevent_project_delete_with_forms`)
            await db.exec(`DROP TRIGGER IF EXISTS trigger_create_project_pages`)
        }

        // Drop tables (cascades will handle page_sections)
        await db.exec(`DROP TABLE IF EXISTS form_input CASCADE`)
        await db.exec(`DROP TABLE IF EXISTS page_sections CASCADE`)
        await db.exec(`DROP TABLE IF EXISTS pages CASCADE`)

        // Restore old status constraint
        if (isPostgres) {
            await db.exec(`
                ALTER TABLE projects 
                DROP CONSTRAINT IF EXISTS projects_status_check
            `)
            // Note: Not adding back old constraint as we don't know what it was
        }

        console.log('✅ Rolled back migration 013')
    }
}

export default migration
