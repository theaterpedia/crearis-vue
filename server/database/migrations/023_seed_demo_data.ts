/**
 * Migration 023: Seed Demo Data
 * 
 * This migration contains all demo/test data previously spread across migrations 019, 020, 021.
 * Includes:
 * - Demo users (from migrations 019, 021)
 * - Demo projects (from migrations 019, 021)
 * - Project memberships
 * - Random project images (from migration 020)
 * 
 * Note: This migration can be re-run safely (uses ON CONFLICT)
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '023_seed_demo_data',
    description: 'Seed demo users, projects, memberships, and images',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 023: Seed demo data...')

        // ============================================================
        // PART 1: Create Demo Users (from migrations 019, 021)
        // ============================================================
        console.log('  - Creating demo users...')

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
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('nina.roob@utopia-in-action.de', 'Nina Roob', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('rosa.koeniger@utopia-in-action.de', 'Rosa Königer', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('annie.duerrwang@theaterpedia.org', 'Annie Dürrwang', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('sabine.menne@theaterpedia.org', 'Sabine Menne', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('astrid.v-creytz@theaterpedia.org', 'Astrid von Creytz', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('esther.sambale@dasei.eu', 'Esther Sambale', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP),
            ('eleanora.allerdings@dasei.eu', 'Eleanora Allerdings', 
             '$2a$10$cW.gFfqOOqEv3a8VEpKTmeFN8MWuXwB6UgL3xb0EpGgXDPyOB8VfW', 'user', CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO NOTHING
        `)
        console.log('    ✓ Created 17 demo users')

        // ============================================================
        // PART 2: Remove old system projects and create demo projects
        // ============================================================
        console.log('  - Removing members from old projects...')
        await db.exec(`
            DELETE FROM project_members 
            WHERE project_id IN ('regio1', 'project1', 'project2')
        `)

        console.log('  - Replacing system projects with demo projects...')
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
        console.log('    ✓ Created project dasei')

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
        console.log('    ✓ Created project raumlauf')

        // Create augsburg (was regio1)
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'augsburg',
                'Augsburg',
                'regio',
                'active',
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
        console.log('    ✓ Created project augsburg')

        // Create aktivkreativ
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'aktivkreativ',
                '**Aktiv-Kreativ-Theater** Theaterpädgogik mit Kindern und Jugendlichen',
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
        console.log('    ✓ Created project aktivkreativ')

        // Create hoftheater_schrobenhausen
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'hoftheater_schrobenhausen',
                '**Hoftheater Schrobenhausen** ein Ort für experimentelles Theater',
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
        console.log('    ✓ Created project hoftheater_schrobenhausen')

        // Create bewaehrungshilfe_augsburg
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'bewaehrungshilfe_augsburg',
                '**Bewährungshilfe Augsburg** ein Ort für experimentelles Theater',
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
        console.log('    ✓ Created project bewaehrungshilfe_augsburg')

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
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project physicaltheatre')

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
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project comictheater')

        // Add einthema_eintag
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
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
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project einthema_eintag')

        // Regional projects from migration 021
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, created_at, updated_at)
            VALUES (
                'oberland',
                '**Regio Oberland** Bad Tölz, Murnau Garmisch-Partenkirchen',
                'regio',
                'demo',
                'sabine.menne@theaterpedia.org',
                'Regional theater network in Oberland region',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project oberland')

        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, created_at, updated_at)
            VALUES (
                'muenchen',
                '**Regio München** Großraum München',
                'regio',
                'demo',
                'annie.duerrwang@theaterpedia.org',
                'Regional theater network in Munich metropolitan area',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project muenchen')

        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, created_at, updated_at)
            VALUES (
                'nuernberg',
                '**Regio Nürnberg** Nürnberg-Fürth-Erlangen',
                'regio',
                'demo',
                'eleanora.allerdings@dasei.eu',
                'Regional theater network in Nuremberg metropolitan region',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project nuernberg')

        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, created_at, updated_at)
            VALUES (
                'wahlfische',
                '**Wahlfische** Demokratie-Projekte und Workshops',
                'project',
                'demo',
                'eleanora.allerdings@dasei.eu',
                'Democracy projects and workshops',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project wahlfische')

        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, created_at, updated_at)
            VALUES (
                'linklater_nuernberg',
                '**Linklater Nürnberg** Stimmbildung',
                'project',
                'demo',
                'eleanora.allerdings@dasei.eu',
                'Voice training and vocal development',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project linklater_nuernberg')

        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, created_at, updated_at)
            VALUES (
                'utopia_in_action',
                '**Utopia in Action** Theater der Unterdrückten Augsburg',
                'project',
                'demo',
                'rosa.koeniger@utopia-in-action.de',
                'Theatre of the Oppressed in Augsburg',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project utopia_in_action')

        // ============================================================
        // PART 3: Add Project Memberships
        // ============================================================
        console.log('  - Adding project memberships...')

        await db.exec(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES 
                ('dasei', 'rosalin.hertrich@dasei.eu', 'member'),
                ('comictheater', 'karel.hajek@theaterpedia.org', 'member'),
                ('raumlauf', 'karel.hajek@theaterpedia.org', 'member'),
                ('augsburg', 'karin.seiler-giehl@theaterpedia.org', 'member'),
                ('augsburg', 'birgitta.miehle@theaterpedia.org', 'member'),
                ('augsburg', 'afra.kriss@theaterpedia.org', 'member'),
                ('augsburg', 'rosa.koeniger@utopia-in-action.de', 'member'),
                ('augsburg', 'nina.roob@utopia-in-action.de', 'member'),
                ('nuernberg', 'esther.sambale@dasei.eu', 'member'),
                ('nuernberg', 'hans.doenitz@theaterpedia.org', 'member'),
                ('muenchen', 'astrid.v-creytz@theaterpedia.org', 'member'),
                ('wahlfische', 'esther.sambale@dasei.eu', 'member')
            ON CONFLICT (project_id, user_id) DO NOTHING
        `)
        console.log('    ✓ Added project memberships')

        // ============================================================
        // PART 4: Add Random Project Images (from migration 020)
        // ============================================================
        console.log('  - Adding project images from events...')

        // Get all events with cimg (if CSV data has been loaded via migration 022)
        const events = await db.all('SELECT cimg FROM events WHERE cimg IS NOT NULL AND cimg != \'\'', [])

        if (events.length > 0) {
            console.log(`    - Found ${events.length} events with images`)

            // Get all projects without images
            const projects = await db.all('SELECT id FROM projects WHERE cimg IS NULL', [])

            console.log(`    - Updating ${projects.length} projects with random images...`)

            // Assign random images to each project
            for (const project of projects) {
                const randomEvent = events[Math.floor(Math.random() * events.length)]
                await db.exec(`
                    UPDATE projects 
                    SET cimg = '${(randomEvent as any).cimg}'
                    WHERE id = '${(project as any).id}'
                `)
            }

            console.log('    ✓ Updated all projects with cover images')
        } else {
            console.log('    ℹ️  No event images found (run migration 022 first for CSV data)')
        }

        console.log('✅ Migration 023 completed: Demo data seeding complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 023 down: Removing demo data...')

        // Remove project memberships
        await db.exec(`
            DELETE FROM project_members 
            WHERE project_id IN (
                'dasei', 'raumlauf', 'augsburg', 'aktivkreativ', 'hoftheater_schrobenhausen',
                'bewaehrungshilfe_augsburg', 'physicaltheatre', 'comictheater', 'einthema_eintag',
                'oberland', 'muenchen', 'nuernberg', 'wahlfische', 'linklater_nuernberg', 'utopia_in_action'
            )
        `)

        // Remove demo projects
        await db.exec(`
            DELETE FROM projects 
            WHERE id IN (
                'dasei', 'raumlauf', 'augsburg', 'aktivkreativ', 'hoftheater_schrobenhausen',
                'bewaehrungshilfe_augsburg', 'physicaltheatre', 'comictheater', 'einthema_eintag',
                'oberland', 'muenchen', 'nuernberg', 'wahlfische', 'linklater_nuernberg', 'utopia_in_action'
            )
        `)

        // Remove demo users
        await db.exec(`
            DELETE FROM users 
            WHERE id IN (
                'rosalin.hertrich@dasei.eu',
                'hans.doenitz@theaterpedia.org',
                'kathrin.jung@theaterpedia.org',
                'karel.hajek@theaterpedia.org',
                'karin.seiler-giehl@theaterpedia.org',
                'afra.kriss@theaterpedia.org',
                'birgitta.miehle@theaterpedia.org',
                'bernd.walter@theaterpedia.org',
                'johanna.schoenfelder@theaterpedia.org',
                'sophie.meier@theaterpedia.org',
                'nina.roob@utopia-in-action.de',
                'rosa.koeniger@utopia-in-action.de',
                'annie.duerrwang@theaterpedia.org',
                'sabine.menne@theaterpedia.org',
                'astrid.v-creytz@theaterpedia.org',
                'esther.sambale@dasei.eu',
                'eleanora.allerdings@dasei.eu'
            )
        `)

        console.log('✅ Migration 023 reverted: Demo data removed')
    }
}
