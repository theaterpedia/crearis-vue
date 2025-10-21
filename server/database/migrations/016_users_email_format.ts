/**
 * Migration 016: Users Email Format
 * 
 * Changes:
 * - Add CHECK constraint to users.id to require email format
 * - Update existing user IDs to email format (@theaterpedia.org)
 * - Update all references to user IDs in other tables
 * 
 * Affected users: admin, base, project1, project2, tp, regio1
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '016_users_email_format',
    description: 'Enforce email format for users.id and migrate existing user IDs',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'
        console.log('Running migration 016: Users email format...')

        // ===================================================================
        // PHASE 1: Create temporary mapping of old IDs to new email IDs
        // ===================================================================
        console.log('\n  📋 Creating ID mapping...')

        const userMappings = [
            { old: 'admin', new: 'admin@theaterpedia.org' },
            { old: 'base', new: 'base@theaterpedia.org' },
            { old: 'project1', new: 'project1@theaterpedia.org' },
            { old: 'project2', new: 'project2@theaterpedia.org' },
            { old: 'tp', new: 'tp@theaterpedia.org' },
            { old: 'regio1', new: 'regio1@theaterpedia.org' }
        ]

        // ===================================================================
        // PHASE 2: Update user IDs in all referencing tables
        // ===================================================================
        console.log('\n  🔄 Updating foreign key references...')

        // Update domains.admin_user_id
        console.log('    → Updating domains.admin_user_id...')
        for (const mapping of userMappings) {
            if (isPostgres) {
                await db.run(
                    `UPDATE domains SET admin_user_id = $1 WHERE admin_user_id = $2`,
                    [mapping.new, mapping.old]
                )
            } else {
                await db.run(
                    `UPDATE domains SET admin_user_id = ? WHERE admin_user_id = ?`,
                    [mapping.new, mapping.old]
                )
            }
        }

        // Update projects.owner_id
        console.log('    → Updating projects.owner_id...')
        for (const mapping of userMappings) {
            if (isPostgres) {
                await db.run(
                    `UPDATE projects SET owner_id = $1 WHERE owner_id = $2`,
                    [mapping.new, mapping.old]
                )
            } else {
                await db.run(
                    `UPDATE projects SET owner_id = ? WHERE owner_id = ?`,
                    [mapping.new, mapping.old]
                )
            }
        }

        // Update events.user_id if it references users
        console.log('    → Updating events.user_id...')
        for (const mapping of userMappings) {
            if (isPostgres) {
                await db.run(
                    `UPDATE events SET user_id = $1 WHERE user_id = $2`,
                    [mapping.new, mapping.old]
                )
            } else {
                await db.run(
                    `UPDATE events SET user_id = ? WHERE user_id = ?`,
                    [mapping.new, mapping.old]
                )
            }
        }

        // ===================================================================
        // PHASE 3: Drop foreign key constraints temporarily (PostgreSQL)
        // ===================================================================
        if (isPostgres) {
            console.log('\n  🔓 Dropping foreign key constraints...')

            // Get constraint names
            const domainConstraints = await db.all(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'domains' 
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name LIKE '%admin_user_id%'
            `)

            for (const constraint of domainConstraints) {
                await db.exec(`ALTER TABLE domains DROP CONSTRAINT IF EXISTS ${(constraint as any).constraint_name}`)
            }

            const projectConstraints = await db.all(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'projects' 
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name LIKE '%owner_id%'
            `)

            for (const constraint of projectConstraints) {
                await db.exec(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS ${(constraint as any).constraint_name}`)
            }

            await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_instructor_id_fkey`)
        }

        // ===================================================================
        // PHASE 4: Update user IDs in users table
        // ===================================================================
        console.log('\n  👤 Updating user IDs...')

        for (const mapping of userMappings) {
            if (isPostgres) {
                // Check if user exists
                const user = await db.get(
                    `SELECT id FROM users WHERE id = $1`,
                    [mapping.old]
                )

                if (user) {
                    // Update the user ID
                    await db.run(
                        `UPDATE users SET id = $1 WHERE id = $2`,
                        [mapping.new, mapping.old]
                    )
                    console.log(`      ✓ ${mapping.old} → ${mapping.new}`)
                }
            } else {
                // SQLite: more complex due to strict foreign keys
                const user = await db.get(
                    `SELECT * FROM users WHERE id = ?`,
                    [mapping.old]
                )

                if (user) {
                    // Insert with new ID
                    await db.run(
                        `INSERT INTO users (id, username, password, role, created_at, instructor_id)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [mapping.new, user.username, user.password, user.role, user.created_at, user.instructor_id]
                    )

                    // Delete old record
                    await db.run(`DELETE FROM users WHERE id = ?`, [mapping.old])
                    console.log(`      ✓ ${mapping.old} → ${mapping.new}`)
                }
            }
        }

        // ===================================================================
        // PHASE 5: Add email validation constraint
        // ===================================================================
        console.log('\n  ✅ Adding email validation constraint...')

        if (isPostgres) {
            // Drop existing constraint first if it exists (idempotent)
            await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_email_format`)

            // Add CHECK constraint for email format
            await db.exec(`
                ALTER TABLE users 
                ADD CONSTRAINT users_id_email_format 
                CHECK (id ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
            `)
        } else {
            // SQLite: constraints can't be added to existing tables, would need table recreation
            console.log('    ⚠️  SQLite: Email validation will be enforced in application layer')
        }

        // ===================================================================
        // PHASE 6: Recreate foreign key constraints (PostgreSQL)
        // ===================================================================
        if (isPostgres) {
            console.log('\n  🔒 Recreating foreign key constraints...')

            // Drop and recreate to ensure idempotency
            await db.exec(`ALTER TABLE domains DROP CONSTRAINT IF EXISTS domains_admin_user_id_fkey`)
            await db.exec(`
                ALTER TABLE domains 
                ADD CONSTRAINT domains_admin_user_id_fkey 
                FOREIGN KEY (admin_user_id) REFERENCES users(id)
            `)

            await db.exec(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey`)
            await db.exec(`
                ALTER TABLE projects 
                ADD CONSTRAINT projects_owner_id_fkey 
                FOREIGN KEY (owner_id) REFERENCES users(id)
            `)

            await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_instructor_id_fkey`)
            await db.exec(`
                ALTER TABLE users 
                ADD CONSTRAINT users_instructor_id_fkey 
                FOREIGN KEY (instructor_id) REFERENCES instructors(id)
            `)
        }

        console.log('\n✅ Migration 016 completed: Users now use email format IDs')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'
        console.log('Rolling back migration 016: Users email format...')

        if (isPostgres) {
            // Drop email validation constraint
            await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_email_format`)

            // Reverse the ID mappings
            const userMappings = [
                { old: 'admin', new: 'admin@theaterpedia.org' },
                { old: 'base', new: 'base@theaterpedia.org' },
                { old: 'project1', new: 'project1@theaterpedia.org' },
                { old: 'project2', new: 'project2@theaterpedia.org' },
                { old: 'tp', new: 'tp@theaterpedia.org' },
                { old: 'regio1', new: 'regio1@theaterpedia.org' }
            ]

            for (const mapping of userMappings) {
                await db.run(
                    `UPDATE users SET id = $1 WHERE id = $2`,
                    [mapping.old, mapping.new]
                )

                await db.run(
                    `UPDATE domains SET admin_user_id = $1 WHERE admin_user_id = $2`,
                    [mapping.old, mapping.new]
                )

                await db.run(
                    `UPDATE projects SET owner_id = $1 WHERE owner_id = $2`,
                    [mapping.old, mapping.new]
                )
            }
        }

        console.log('✅ Rollback complete')
    }
}
