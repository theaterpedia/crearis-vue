/**
 * Migration 019: Re-seed users and projects
 * 
 * Changes:
 * - Create new users: Rosalin Hertrich, Hans Dönitz, Kathrin Jung, Karel Hajek
 * - Remove members from projects: regio1, project1, project2
 * - Rename projects: project1 → dasei, project2 → raumlauf, regio1 → augsburg
 * - Update project ownership and status
 * - Add new projects: physicaltheatre, comictheater, einthema_eintag
 * - Set up project memberships
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '019_reseed_users_and_projects',
    description: 'Re-seed users and projects with new data',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 019: Re-seed users and projects...')

        // 1. Create new users
        console.log('  - Creating new users...')

        await db.exec(`
            INSERT INTO users (id, username, password, role, created_at) 
            VALUES 
            ('rosalin.hertrich@dasei.eu', 'Rosalin Hertrich', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('hans.doenitz@theaterpedia.org', 'Hans Dönitz', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('kathrin.jung@theaterpedia.org', 'Kathrin Jung', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('karel.hajek@theaterpedia.org', 'Karel Hajek', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('karin.seiler-giehl@theaterpedia.org', 'Karin Seiler-Giehl', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('afra.kriss@theaterpedia.org', 'Afra Kriss', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),             
            ('birgitta.miehle@theaterpedia.org', 'Birgitta Miehle', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),              
            ('bernd.walter@theaterpedia.org', 'Bernd Walter', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('johanna.schoenfelder@theaterpedia.org', 'Johanna Schönfelder', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('sophie.meier@theaterpedia.org', 'Sophie Meier', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP)                                                    
            ON CONFLICT (id) DO NOTHING
        `)
        console.log('    ✓ Created users: Rosalin Hertrich, Hans Dönitz, Kathrin Jung, Karel Hajek')

        // 2. Remove all members from projects regio1, project1, project2
        console.log('  - Removing members from projects regio1, project1, project2...')
        await db.exec(`
            DELETE FROM project_members 
            WHERE project_id IN ('regio1', 'project1', 'project2')
        `)
        console.log('    ✓ Removed all members from specified projects')

        // 3. Rename projects (safe now that members are removed)
        console.log('  - Renaming projects...')

        // Delete old projects and recreate with new IDs
        await db.exec(`
            DELETE FROM projects WHERE id IN ('project1', 'project2', 'regio1', 'dasei', 'raumlauf')
        `)

        // Create dasei (was project1)
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'dasei',
                'DASEI',
                'project',
                'active',
                'hans.doenitz@theaterpedia.org',
                'DASEI - Digitaler Alltag in der Stadtentwicklung',
                6,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project dasei (owner: Hans Dönitz, status: active)')

        // Create raumlauf (was project2)
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'raumlauf',
                'Raumlauf',
                'topic',
                'draft',
                'hans.doenitz@theaterpedia.org',
                'Raumlauf - Regional theater project',
                1,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project raumlauf (owner: Hans Dönitz, type: topic, status: draft)')

        // Create augsburg (was regio1)
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'augsburg',
                'Augsburg',
                'regio',
                'draft',
                'kathrin.jung@theaterpedia.org',
                'Augsburg regional project',
                2,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project augsburg (owner: Kathrin Jung)')        // 4. Add project memberships
        console.log('  - Adding project memberships...')

        // Create aktivkreativ
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, regio, theme,created_at, updated_at)
            VALUES (
                'aktivkreativ',
                '**Aktiv-Kreativ-Theater**Theaterpädgogik mit Kindern und Jugendlichen',
                'project',
                'demo',
                'kathrin.jung@theaterpedia.org',
                'aktivkreativ description',
                'augsburg',
                1,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project Aktiv-Kreativ (owner: Kathrin Jung)')        // 4. Add project memberships
        console.log('  - Adding project memberships...')

        // Create hoftheater
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, regio, theme,created_at, updated_at)
            VALUES (
                'hoftheater_schrobenhausen',
                '**Hoftheater Schrobenhausen**ein Ort für experimentelles Theater',
                'project',
                'demo',
                'afra.kriss@theaterpedia.org',
                'hoftheater description',
                'augsburg',
                2,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project Hoftheater (owner: Kathrin Jung)')        // 4. Add project memberships
        console.log('  - Adding project memberships...')

        // Create bewaehrungshilfe_augsburg
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'bewaehrungshilfe_augsburg',
                '**Bewährungshilfe Augsburg**ein Ort für experimentelles Theater',
                'project',
                'demo',
                'afra.kriss@theaterpedia.org',
                'bewaehrungshilfe description',
                'augsburg',
                4,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project Bewährungshilfe Augsburg (owner: Afra Kriss)')        // 4. Add project memberships
        console.log('  - Adding project memberships...')

        // Make Rosalin Hertrich a member of dasei
        await db.exec(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES ('dasei', 'rosalin.hertrich@dasei.eu', 'member')
            ON CONFLICT (project_id, user_id) DO NOTHING
        `)
        console.log('    ✓ Added Rosalin Hertrich to dasei')

        console.log('  - Adding project memberships...')

        // Make Rosalin Hertrich a member of dasei
        await db.exec(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES ('dasei', 'rosalin.hertrich@dasei.eu', 'member')
            ON CONFLICT (project_id, user_id) DO NOTHING
        `)
        console.log('    ✓ Added Rosalin Hertrich to dasei')

        console.log('  - Adding project memberships...')

        // Make Rosalin Hertrich a member of dasei
        await db.exec(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES ('dasei', 'rosalin.hertrich@dasei.eu', 'member')
            ON CONFLICT (project_id, user_id) DO NOTHING
        `)
        console.log('    ✓ Added Rosalin Hertrich to dasei')

        // 5. Add new projects
        console.log('  - Adding new projects...')

        // Add physicaltheatre
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'physicaltheatre',
                'Physical Theatre',
                'topic',
                'demo',
                'rosalin.hertrich@dasei.eu',
                'Topic site about physical theatre',
                1,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                owner_id = 'rosalin.hertrich@dasei.eu',
                status = 'demo',
                type = 'topic'
        `)
        console.log('    ✓ Added project physicaltheatre (owner: Rosalin Hertrich, status: demo)')

        // Add comictheater
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'comictheater',
                'Comic Theater',
                'topic',
                'demo',
                'kathrin.jung@theaterpedia.org',
                'Topic site about comic theater',
                2,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                owner_id = 'kathrin.jung@theaterpedia.org',
                status = 'demo',
                type = 'topic'
        `)
        console.log('    ✓ Added project comictheater (owner: Kathrin Jung, status: demo)')

        // Add einthema_eintag
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme,created_at, updated_at)
            VALUES (
                'einthema_eintag',
                'Ein Thema - Ein Tag',
                'topic',
                'demo',
                'karel.hajek@theaterpedia.org',
                'Topic site for one-day workshops',
                3,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                owner_id = 'karel.hajek@theaterpedia.org',
                status = 'demo',
                type = 'topic'
        `)
        console.log('    ✓ Added project einthema_eintag (owner: Karel Hajek, status: demo)')

        // 6. Add Karel Hajek to comictheater and raumlauf
        console.log('  - Adding Karel Hajek to projects...')

        await db.exec(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES 
                ('comictheater', 'karel.hajek@theaterpedia.org', 'member'),
                ('raumlauf', 'karel.hajek@theaterpedia.org', 'member')
            ON CONFLICT (project_id, user_id) DO NOTHING
        `)
        console.log('    ✓ Added Karel Hajek to comictheater and raumlauf')

        // 7. Add members to muenchen, augsburg and oberland
        await db.exec(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES               
                ('augsburg', 'karin.seiler-giehl@theaterpedia.org', 'member'),
                ('augsburg', 'birgitta.miehle@theaterpedia.org', 'member'),
                ('augsburg', 'afra.kriss@theaterpedia.org', 'member')
            ON CONFLICT (project_id, user_id) DO NOTHING
        `)
        console.log('    ✓ Added members to muenchen, augsburg and oberland')

        console.log('✅ Migration 019 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 019 down: Reverting user and project seeding...')

        // Remove new project memberships
        await db.exec(`
            DELETE FROM project_members 
            WHERE (project_id = 'dasei' AND user_id = 'rosalin.hertrich@dasei.eu')
               OR (project_id = 'comictheater' AND user_id = 'karel.hajek@theaterpedia.org')
               OR (project_id = 'raumlauf' AND user_id = 'karel.hajek@theaterpedia.org')
        `)

        // Remove new projects
        await db.exec(`
            DELETE FROM projects 
            WHERE id IN ('physicaltheatre', 'comictheater', 'einthema_eintag')
        `)

        // Revert project renames
        await db.exec(`
            UPDATE projects SET id = 'project1', heading = 'Project 1' WHERE id = 'dasei'
        `)
        await db.exec(`
            UPDATE projects SET id = 'project2', heading = 'Project 2' WHERE id = 'raumlauf'
        `)
        await db.exec(`
            UPDATE projects SET id = 'regio1', heading = 'Regio 1' WHERE id = 'augsburg'
        `)

        // Remove new users
        await db.exec(`
            DELETE FROM users 
            WHERE id IN (
                'rosalin.hertrich@dasei.eu',
                'hans.doenitz@theaterpedia.org',
                'kathrin.jung@theaterpedia.org',
                'karel.hajek@theaterpedia.org'
            )
        `)

        console.log('✅ Migration 019 reverted')
    }
}
