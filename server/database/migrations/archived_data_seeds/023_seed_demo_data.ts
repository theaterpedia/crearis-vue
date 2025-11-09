/**
 * Migration 023: Seed Demo Data
 * 
 * IMPORTANT: Support for SQLite is completely dropped from migration 019 onwards.
 * Reason: Implementation follows PostgreSQL-specific syntax (custom types, computed columns, etc.)
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

        // Helper function to get user ID by email (sysmail)
        const getUserId = async (email: string): Promise<number | null> => {
            const user = await db.get('SELECT id FROM users WHERE sysmail = ?', [email])
            return user ? (user as any).id : null
        }

        // ============================================================
        // PART 1: Create Demo Users (from migrations 019, 021)
        // ============================================================
        console.log('  - Creating demo users...')

        await db.exec(`
            INSERT INTO users (sysmail, username, password, role, created_at) 
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
            ON CONFLICT (sysmail) DO NOTHING
        `)
        console.log('    ✓ Created 17 demo users')

        // Get user IDs for project ownership
        const hansId = await getUserId('hans.doenitz@theaterpedia.org')
        const kathrinId = await getUserId('kathrin.jung@theaterpedia.org')
        const afraId = await getUserId('afra.kriss@theaterpedia.org')
        const rosalinId = await getUserId('rosalin.hertrich@dasei.eu')
        const karelId = await getUserId('karel.hajek@theaterpedia.org')
        const sabineId = await getUserId('sabine.menne@theaterpedia.org')
        const annieId = await getUserId('annie.duerrwang@theaterpedia.org')
        const eleanoraId = await getUserId('eleanora.allerdings@dasei.eu')
        const rosaId = await getUserId('rosa.koeniger@utopia-in-action.de')

        // ============================================================
        // PART 2: Remove old system projects and create demo projects
        // ============================================================
        console.log('  - Removing members from old projects...')
        // Get project IDs for deletion
        const oldProjectIds = await db.all(`
            SELECT id FROM projects 
            WHERE domaincode IN ('regio1', 'project1', 'project2')
        `, [])

        if (oldProjectIds.length > 0) {
            const ids = oldProjectIds.map((p: any) => p.id).join(',')
            await db.exec(`
                DELETE FROM project_members 
                WHERE project_id IN (${ids})
            `)
        }

        console.log('  - Replacing system projects with demo projects...')
        await db.exec(`
            DELETE FROM projects WHERE domaincode IN ('project1', 'project2', 'regio1', 'dasei', 'raumlauf')
        `)

        // Get status IDs
        const draftStatusId = await db.get('SELECT id FROM status WHERE name = ? AND "table" = ?', ['draft', 'projects'])
        const demoStatusId = await db.get('SELECT id FROM status WHERE name = ? AND "table" = ?', ['demo', 'projects'])

        const draftStatus = (draftStatusId as any)?.id || 53  // draft for projects
        const demoStatus = (demoStatusId as any)?.id || 19   // demo (common status)

        // Create dasei (was project1) - was 'active', now 'draft'
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'dasei',
                'DASEI',
                'DASEI',
                'project',
                ${draftStatus},
                ${hansId},
                'DASEI - Digitaler Alltag in der Stadtentwicklung',
                6,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project dasei')

        // Create raumlauf (was project2)
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'raumlauf',
                'Raumlauf',
                'Raumlauf',
                'topic',
                ${draftStatus},
                ${hansId},
                'Raumlauf - Regional theater project',
                1,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project raumlauf')

        // Create augsburg (was regio1) - was 'active', now 'draft'
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'augsburg',
                'Augsburg',
                'Augsburg',
                'regio',
                ${draftStatus},
                ${kathrinId},
                'Augsburg regional project',
                2,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project augsburg')

        // Get augsburg project ID for regio reference
        const augsburgProject = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['augsburg'])
        const augsburgId = (augsburgProject as any)?.id

        // Create aktivkreativ
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'aktivkreativ',
                'Aktiv-Kreativ-Theater',
                '**Aktiv-Kreativ-Theater** Theaterpädgogik mit Kindern und Jugendlichen',
                'project',
                ${demoStatus},
                ${kathrinId},
                'aktivkreativ description',
                ${augsburgId},
                1,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project aktivkreativ')

        // Create hoftheater_schrobenhausen
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'hoftheater_schrobenhausen',
                'Hoftheater Schrobenhausen',
                '**Hoftheater Schrobenhausen** ein Ort für experimentelles Theater',
                'project',
                ${demoStatus},
                ${afraId},
                'hoftheater description',
                ${augsburgId},
                2,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project hoftheater_schrobenhausen')

        // Create bewaehrungshilfe_augsburg
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'bewaehrungshilfe_augsburg',
                'Bewährungshilfe Augsburg',
                '**Bewährungshilfe Augsburg** ein Ort für experimentelles Theater',
                'project',
                ${demoStatus},
                ${afraId},
                'bewaehrungshilfe description',
                ${augsburgId},
                4,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project bewaehrungshilfe_augsburg')

        // Add physicaltheatre
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'physicaltheatre',
                'Physical Theatre',
                'Physical Theatre',
                'topic',
                ${demoStatus},
                ${rosalinId},
                'Topic site about physical theatre',
                1,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project physicaltheatre')

        // Add comictheater
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'comictheater',
                'Comic Theater',
                'Comic Theater',
                'topic',
                ${demoStatus},
                ${kathrinId},
                'Topic site about comic theater',
                2,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project comictheater')

        // Add einthema_eintag
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'einthema_eintag',
                'Ein Thema - Ein Tag',
                'Ein Thema - Ein Tag',
                'topic',
                ${demoStatus},
                ${karelId},
                'Topic site for one-day workshops',
                3,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project einthema_eintag')

        // Regional projects from migration 021
        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, created_at, updated_at)
            VALUES (
                'oberland',
                'Regio Oberland',
                '**Regio Oberland** Bad Tölz, Murnau Garmisch-Partenkirchen',
                'regio',
                ${demoStatus},
                ${sabineId},
                'Regional theater network in Oberland region',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project oberland')

        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, created_at, updated_at)
            VALUES (
                'muenchen',
                'Regio München',
                '**Regio München** Großraum München',
                'regio',
                ${demoStatus},
                ${annieId},
                'Regional theater network in Munich metropolitan area',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project muenchen')

        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, created_at, updated_at)
            VALUES (
                'nuernberg',
                'Regio Nürnberg',
                '**Regio Nürnberg** Nürnberg-Fürth-Erlangen',
                'regio',
                ${demoStatus},
                ${eleanoraId},
                'Regional theater network in Nuremberg metropolitan region',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project nuernberg')

        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, created_at, updated_at)
            VALUES (
                'wahlfische',
                'Wahlfische',
                '**Wahlfische** Demokratie-Projekte und Workshops',
                'project',
                ${demoStatus},
                ${eleanoraId},
                'Democracy projects and workshops',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project wahlfische')

        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, created_at, updated_at)
            VALUES (
                'linklater_nuernberg',
                'Linklater Nürnberg',
                '**Linklater Nürnberg** Stimmbildung',
                'project',
                ${demoStatus},
                ${eleanoraId},
                'Voice training and vocal development',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project linklater_nuernberg')

        await db.exec(`
            INSERT INTO projects (domaincode, name, heading, type, status_id, owner_id, description, created_at, updated_at)
            VALUES (
                'utopia_in_action',
                'Utopia in Action',
                '**Utopia in Action** Theater der Unterdrückten Augsburg',
                'project',
                ${demoStatus},
                ${rosaId},
                'Theatre of the Oppressed in Augsburg',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (domaincode) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status_id = EXCLUDED.status_id,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Created project utopia_in_action')

        // ============================================================
        // PART 3: Add Project Memberships
        // ============================================================
        console.log('  - Adding project memberships...')

        // Get additional user IDs needed for memberships
        const karinId = await getUserId('karin.seiler-giehl@theaterpedia.org')
        const birgittaId = await getUserId('birgitta.miehle@theaterpedia.org')
        const ninaId = await getUserId('nina.roob@utopia-in-action.de')
        const estherId = await getUserId('esther.sambale@dasei.eu')
        const astridId = await getUserId('astrid.v-creytz@theaterpedia.org')

        // Get project IDs (augsburgId already fetched earlier)
        const daseiProject = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['dasei'])
        const comictheaterProject = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['comictheater'])
        const raumlaufProject = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['raumlauf'])
        const nuernbergProject = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['nuernberg'])
        const muenchenProject = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['muenchen'])
        const wahlfischeProject = await db.get('SELECT id FROM projects WHERE domaincode = ?', ['wahlfische'])

        const daseiId = (daseiProject as any)?.id
        const comictheaterId = (comictheaterProject as any)?.id
        const raumlaufId = (raumlaufProject as any)?.id
        const nuernbergId = (nuernbergProject as any)?.id
        const muenchenId = (muenchenProject as any)?.id
        const wahlfischeId = (wahlfischeProject as any)?.id

        // Insert memberships
        const memberships = [
            { project_id: daseiId, user_id: rosalinId, role: 'member' },
            { project_id: comictheaterId, user_id: karelId, role: 'member' },
            { project_id: raumlaufId, user_id: karelId, role: 'member' },
            { project_id: augsburgId, user_id: karinId, role: 'member' },
            { project_id: augsburgId, user_id: birgittaId, role: 'member' },
            { project_id: augsburgId, user_id: afraId, role: 'member' },
            { project_id: augsburgId, user_id: rosaId, role: 'member' },
            { project_id: augsburgId, user_id: ninaId, role: 'member' },
            { project_id: nuernbergId, user_id: estherId, role: 'member' },
            { project_id: nuernbergId, user_id: hansId, role: 'member' },
            { project_id: muenchenId, user_id: astridId, role: 'member' },
            { project_id: wahlfischeId, user_id: estherId, role: 'member' }
        ]

        for (const membership of memberships) {
            if (membership.project_id && membership.user_id) {
                await db.exec(`
                    INSERT INTO project_members (project_id, user_id, role)
                    VALUES (${membership.project_id}, ${membership.user_id}, '${membership.role}')
                    ON CONFLICT (project_id, user_id) DO NOTHING
                `)
            }
        }

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

        // Get project IDs for deletion
        const projectDomains = [
            'dasei', 'raumlauf', 'augsburg', 'aktivkreativ', 'hoftheater_schrobenhausen',
            'bewaehrungshilfe_augsburg', 'physicaltheatre', 'comictheater', 'einthema_eintag',
            'oberland', 'muenchen', 'nuernberg', 'wahlfische', 'linklater_nuernberg', 'utopia_in_action'
        ]

        const projectIds = await db.all(`
            SELECT id FROM projects 
            WHERE domaincode IN (${projectDomains.map(() => '?').join(',')})
        `, projectDomains)

        if (projectIds.length > 0) {
            const ids = projectIds.map((p: any) => p.id).join(',')

            // Remove project memberships
            await db.exec(`
                DELETE FROM project_members 
                WHERE project_id IN (${ids})
            `)

            // Remove demo projects
            await db.exec(`
                DELETE FROM projects 
                WHERE id IN (${ids})
            `)
        }

        // Remove demo users (using sysmail, not id)
        await db.exec(`
            DELETE FROM users 
            WHERE sysmail IN (
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
