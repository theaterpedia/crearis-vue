/**
 * Migration 015: Domain System and Project Extensions
 * 
 * Phase: system-seed (runs before all other seeding)
 * 
 * Changes:
 * - Add TLDs table (top-level domains)
 * - Add sysdomains table (system domains)
 * - Add domains table (project domains)
 * - Update projects table (owner, is_company, members, config, domain)
 * - Update users table (instructor reference)
 * - Update instructors table (is_user computed property)
 * - Update locations table (project reference)
 * - Add computed properties to projects (locations collection)
 * - System seed TLDs and sysdomains
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '015_domain_system_and_extensions',
    description: 'Add domain system tables and extend projects/users/locations with new fields',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Running migration 015: Domain system and project extensions...')

        // ===================================================================
        // PHASE 1: SYSTEM SEED - TLDs Table
        // ===================================================================
        console.log('\n  🌐 Creating TLDs table...')

        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS tlds (
                    name TEXT PRIMARY KEY,
                    description TEXT,
                    relevance INTEGER CHECK (relevance IN (1, 2, 3, 4))
                )
            `)
        } else {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS tlds (
                    name TEXT PRIMARY KEY,
                    description TEXT,
                    relevance INTEGER CHECK (relevance IN (1, 2, 3, 4))
                )
            `)
        }

        console.log('  ℹ️  TLD seeding moved to migration 021')

        // ===================================================================
        // PHASE 2: SYSTEM SEED - Sysdomains Table
        // ===================================================================
        console.log('\n  🌐 Creating sysdomains table...')

        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS sysdomains (
                    id SERIAL PRIMARY KEY,
                    tld TEXT NOT NULL REFERENCES tlds(name),
                    domain TEXT NOT NULL,
                    subdomain TEXT,
                    description TEXT,
                    options JSONB
                )
            `)

            // Add computed column for domainstring
            console.log('  → Adding domainstring computed column...')
            await db.exec(`
                ALTER TABLE sysdomains 
                ADD COLUMN IF NOT EXISTS domainstring TEXT 
                GENERATED ALWAYS AS (
                    CASE 
                        WHEN subdomain IS NOT NULL AND subdomain != '' 
                        THEN subdomain || '.' || domain 
                        ELSE domain 
                    END
                ) STORED
            `)
        } else {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS sysdomains (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tld TEXT NOT NULL REFERENCES tlds(name),
                    domain TEXT NOT NULL,
                    subdomain TEXT,
                    description TEXT,
                    options TEXT
                )
            `)

            // SQLite 3.31+ supports GENERATED columns
            try {
                await db.exec(`
                    ALTER TABLE sysdomains 
                    ADD COLUMN domainstring TEXT 
                    GENERATED ALWAYS AS (
                        CASE 
                            WHEN subdomain IS NOT NULL AND subdomain != '' 
                            THEN subdomain || '.' || domain 
                            ELSE domain 
                        END
                    ) STORED
                `)
            } catch (e: any) {
                console.log('    ⚠️  SQLite: Could not add GENERATED column:', e.message)
            }
        }

        console.log('  ℹ️  Sysdomain seeding moved to migration 021')

        // ===================================================================
        // PHASE 3: Domains Table (for projects)
        // ===================================================================
        console.log('\n  🌐 Creating domains table...')

        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS domains (
                    id SERIAL PRIMARY KEY,
                    sysdomain_id INTEGER REFERENCES sysdomains(id),
                    tld TEXT NOT NULL REFERENCES tlds(name),
                    textdomain TEXT CHECK (textdomain IS NULL OR textdomain ~ '^[a-z0-9_]+$'),
                    admin_user_id TEXT REFERENCES users(id),
                    project_id TEXT REFERENCES projects(id),
                    description TEXT
                )
            `)

            // Create function to compute domainname (since subqueries not allowed in generated columns)
            console.log('  → Creating domainname function...')
            await db.exec(`
                CREATE OR REPLACE FUNCTION compute_domainname(
                    p_sysdomain_id INTEGER,
                    p_tld TEXT,
                    p_textdomain TEXT
                ) RETURNS TEXT AS $$
                DECLARE
                    v_domainstring TEXT;
                BEGIN
                    IF p_sysdomain_id IS NOT NULL THEN
                        SELECT domainstring INTO v_domainstring
                        FROM sysdomains
                        WHERE id = p_sysdomain_id;
                        
                        IF p_textdomain IS NOT NULL AND p_textdomain != '' THEN
                            RETURN p_textdomain || '.' || v_domainstring || '.' || p_tld;
                        ELSE
                            RETURN v_domainstring || '.' || p_tld;
                        END IF;
                    ELSE
                        RETURN p_textdomain || '.' || p_tld;
                    END IF;
                END;
                $$ LANGUAGE plpgsql IMMUTABLE
            `)

            // Add domainname column using the function
            console.log('  → Adding domainname computed column...')
            await db.exec(`
                ALTER TABLE domains 
                ADD COLUMN IF NOT EXISTS domainname TEXT 
                GENERATED ALWAYS AS (
                    compute_domainname(sysdomain_id, tld, textdomain)
                ) STORED
            `)

            // Add unique constraint on domainname
            await db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_domainname 
                ON domains(domainname)
            `)

            // Add trigger to enforce tld matching when sysdomain is set
            await db.exec(`
                CREATE OR REPLACE FUNCTION enforce_sysdomain_tld()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.sysdomain_id IS NOT NULL THEN
                        SELECT tld INTO NEW.tld 
                        FROM sysdomains 
                        WHERE id = NEW.sysdomain_id;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
            `)

            await db.exec(`
                DROP TRIGGER IF EXISTS trigger_enforce_sysdomain_tld ON domains
            `)

            await db.exec(`
                CREATE TRIGGER trigger_enforce_sysdomain_tld
                BEFORE INSERT OR UPDATE ON domains
                FOR EACH ROW
                EXECUTE FUNCTION enforce_sysdomain_tld()
            `)
        } else {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS domains (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sysdomain_id INTEGER REFERENCES sysdomains(id),
                    tld TEXT NOT NULL REFERENCES tlds(name),
                    textdomain TEXT CHECK (textdomain IS NULL OR (textdomain NOT LIKE '%.%')),
                    admin_user_id TEXT REFERENCES users(id),
                    project_id TEXT REFERENCES projects(id),
                    description TEXT
                )
            `)

            // SQLite: Add computed column if supported
            try {
                await db.exec(`
                    ALTER TABLE domains 
                    ADD COLUMN domainname TEXT 
                    GENERATED ALWAYS AS (
                        CASE 
                            WHEN sysdomain_id IS NOT NULL AND (textdomain IS NULL OR textdomain = '') 
                            THEN (SELECT domainstring || '.' || tld FROM sysdomains WHERE id = domains.sysdomain_id)
                            WHEN sysdomain_id IS NOT NULL AND textdomain IS NOT NULL AND textdomain != '' 
                            THEN textdomain || '.' || (SELECT domainstring || '.' || tld FROM sysdomains WHERE id = domains.sysdomain_id)
                            ELSE textdomain || '.' || tld 
                        END
                    ) STORED
                `)

                await db.exec(`
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_domainname 
                    ON domains(domainname)
                `)
            } catch (e: any) {
                console.log('    ⚠️  SQLite: Could not add GENERATED column:', e.message)
            }
        }

        // ===================================================================
        // PHASE 4: Update Projects Table
        // ===================================================================
        console.log('\n  📦 Updating projects table...')

        if (isPostgres) {
            await db.exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id)`)
            await db.exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_company BOOLEAN DEFAULT FALSE`)
            await db.exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS config JSONB`)
            await db.exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_id INTEGER REFERENCES domains(id)`)

            // Note: members is a many-to-many relationship, would need a junction table
            // For now, we'll store as JSONB array of user IDs
            await db.exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS member_ids JSONB`)
        } else {
            try {
                await db.exec(`ALTER TABLE projects ADD COLUMN owner_id TEXT REFERENCES users(id)`)
            } catch (e: any) {
                if (!e.message.includes('duplicate column')) throw e
            }
            try {
                await db.exec(`ALTER TABLE projects ADD COLUMN is_company INTEGER DEFAULT 0`)
            } catch (e: any) {
                if (!e.message.includes('duplicate column')) throw e
            }
            try {
                await db.exec(`ALTER TABLE projects ADD COLUMN config TEXT`)
            } catch (e: any) {
                if (!e.message.includes('duplicate column')) throw e
            }
            try {
                await db.exec(`ALTER TABLE projects ADD COLUMN domain_id INTEGER REFERENCES domains(id)`)
            } catch (e: any) {
                if (!e.message.includes('duplicate column')) throw e
            }
            try {
                await db.exec(`ALTER TABLE projects ADD COLUMN member_ids TEXT`)
            } catch (e: any) {
                if (!e.message.includes('duplicate column')) throw e
            }
        }

        // ===================================================================
        // PHASE 5: Update Users Table
        // ===================================================================
        console.log('\n  👤 Updating users table...')

        if (isPostgres) {
            // Drop old role check constraint and add new one with 'base' role
            await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`)
            await db.exec(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK(role IN ('user', 'admin', 'base'))`)

            await db.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS instructor_id TEXT REFERENCES instructors(id)`)
        } else {
            try {
                await db.exec(`ALTER TABLE users ADD COLUMN instructor_id TEXT REFERENCES instructors(id)`)
            } catch (e: any) {
                if (!e.message.includes('duplicate column')) throw e
            }
        }

        // ===================================================================
        // PHASE 6: Update Instructors Table (add is_user computed)
        // ===================================================================
        console.log('\n  🎓 Updating instructors table...')

        // Note: is_user would be computed by looking up if instructor_id exists in users table
        // This is best done in application code or views rather than stored computed column
        if (isPostgres) {
            console.log('    ℹ️  is_user property will be computed in application layer')
            // Could create a view if needed:
            // CREATE VIEW instructors_with_user AS 
            // SELECT i.*, EXISTS(SELECT 1 FROM users WHERE instructor_id = i.id) as is_user
            // FROM instructors i
        }

        // ===================================================================
        // PHASE 7: Update Locations Table
        // ===================================================================
        console.log('\n  📍 Updating locations table...')

        if (isPostgres) {
            await db.exec(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id)`)
        } else {
            try {
                await db.exec(`ALTER TABLE locations ADD COLUMN project_id TEXT REFERENCES projects(id)`)
            } catch (e: any) {
                if (!e.message.includes('duplicate column')) throw e
            }
        }

        // ===================================================================
        // PHASE 8-10: Removed Data Seeding (moved to migration 021)
        // ===================================================================
        console.log('\n  ℹ️  User seeding, project ownership, and location linking moved to migration 021')

        console.log('\n✅ Migration 015 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        console.log('Rolling back migration 015...')

        if (isPostgres) {
            // Drop tables in reverse order
            await db.exec(`DROP TABLE IF EXISTS domains CASCADE`)
            await db.exec(`DROP TABLE IF EXISTS sysdomains CASCADE`)
            await db.exec(`DROP TABLE IF EXISTS tlds CASCADE`)

            // Drop added columns
            await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS domain_id`)
            await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS member_ids`)
            await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS config`)
            await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS is_company`)
            await db.exec(`ALTER TABLE projects DROP COLUMN IF EXISTS owner_id`)

            await db.exec(`ALTER TABLE users DROP COLUMN IF EXISTS instructor_id`)
            await db.exec(`ALTER TABLE locations DROP COLUMN IF EXISTS project_id`)

            // Drop triggers and functions
            await db.exec(`DROP TRIGGER IF EXISTS trigger_enforce_sysdomain_tld ON domains`)
            await db.exec(`DROP FUNCTION IF EXISTS enforce_sysdomain_tld()`)
        } else {
            console.log('  ⚠️  SQLite: Cannot easily roll back table/column changes')
        }

        console.log('✅ Rolled back migration 015')
    }
}

export default migration
