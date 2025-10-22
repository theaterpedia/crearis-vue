/**
 * Migration 021: Add users and regional projects
 * 
 * Changes:
 * - Add new users: Nina Roob, Rosa Königer, Annie Dürrwang, Sabine Menne, Astrid von Creytz, Esther Sambale, Eleanora Allerdings
 * - Add new projects: oberland, muenchen, nuernberg, wahlfische, linklater_nuernberg, utopia_in_action
 * - Set up project memberships
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '021_add_users_and_regional_projects',
    description: 'Add new users and regional projects with memberships',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 021: Add users and regional projects...')

        // 1. Create new users
        console.log('  - Creating new users...')

        await db.exec(`
            INSERT INTO users (id, username, password, role, created_at) 
            VALUES 
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
        console.log('    ✓ Created 7 new users')

        // 2. Add new projects (all status: demo)
        console.log('  - Adding new projects...')

        // Regio Oberland
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'oberland',
                '**Regio Oberland** Bad Tölz, Murnau Garmisch-Partenkirchen',
                'regio',
                'demo',
                'sabine.menne@theaterpedia.org',
                'Regional theater network in Oberland region',
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
        console.log('    ✓ Added project: Regio Oberland')

        // Regio München
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'muenchen',
                '**Regio München** Großraum München',
                'regio',
                'demo',
                'annie.duerrwang@theaterpedia.org',
                'Regional theater network in Munich metropolitan area',
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
        console.log('    ✓ Added project: Regio München')

        // Regio Nürnberg
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, created_at, updated_at)
            VALUES (
                'nuernberg',
                '**Regio Nürnberg** Nürnberg-Fürth-Erlangen',
                'regio',
                'demo',
                'eleanora.allerdings@dasei.eu',
                'Regional theater network in Nuremberg metropolitan region',
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
        console.log('    ✓ Added project: Regio Nürnberg')

        // Wahlfische
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'wahlfische',
                '**Wahlfische** Demokratie-Projekte und Workshops',
                'project',
                'demo',
                'eleanora.allerdings@dasei.eu',
                'Democracy projects and workshops',
                'nuernberg',
                5,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Added project: Wahlfische')

        // Linklater Nürnberg
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, regio, theme, created_at, updated_at)
            VALUES (
                'linklater_nuernberg',
                '**Linklater Nürnberg** Stimmbildung',
                'project',
                'demo',
                'eleanora.allerdings@dasei.eu',
                'Voice training and vocal development',
                'nuernberg',
                5,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Added project: Linklater Nürnberg')

        // Utopia in Action
        await db.exec(`
            INSERT INTO projects (id, heading, type, status, owner_id, description, theme, regio, created_at, updated_at)
            VALUES (
                'utopia_in_action',
                '**Utopia in Action** Theater der Unterdrückten Augsburg',
                'project',
                'demo',
                'rosa.koeniger@utopia-in-action.de',
                'Theatre of the Oppressed in Augsburg',
                4,
                'augsburg',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                heading = EXCLUDED.heading,
                owner_id = EXCLUDED.owner_id,
                status = EXCLUDED.status,
                type = EXCLUDED.type
        `)
        console.log('    ✓ Added project: Utopia in Action')

        // 3. Add project memberships
        console.log('  - Adding project memberships...')

        await db.exec(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES 
                ('muenchen', 'bernd.walter@theaterpedia.org', 'member'),
                ('oberland', 'sophie.meier@theaterpedia.org', 'member'),
                ('oberland', 'johanna.schoenfelder@theaterpedia.org', 'member'),                
                ('augsburg', 'rosa.koeniger@utopia-in-action.de', 'member'),
                ('augsburg', 'nina.roob@utopia-in-action.de', 'member'),
                ('nuernberg', 'esther.sambale@dasei.eu', 'member'),
                ('nuernberg', 'hans.doenitz@theaterpedia.org', 'member'),
                ('muenchen', 'astrid.v-creytz@theaterpedia.org', 'member'),
                ('wahlfische', 'esther.sambale@dasei.eu', 'member')
            ON CONFLICT (project_id, user_id) DO NOTHING
        `)
        console.log('    ✓ Added project memberships')

        console.log('✅ Migration 021 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 021 down: Reverting users and projects...')

        // Remove project memberships
        await db.exec(`
            DELETE FROM project_members 
            WHERE (project_id = 'augsburg' AND user_id IN ('rosa.koeniger@utopia-in-action.de', 'nina.roob@utopia-in-action.de'))
               OR (project_id = 'nuernberg' AND user_id IN ('esther.sambale@dasei.eu', 'hans.doenitz@theaterpedia.org'))
               OR (project_id = 'muenchen' AND user_id IN ('astrid.v-creytz@theaterpedia.org', 'bernd.walter@theaterpedia.org'))
               OR (project_id = 'oberland' AND user_id IN ('sophie.meier@theaterpedia.org', 'johanna.schoenfelder@theaterpedia.org'))
               OR (project_id = 'wahlfische' AND user_id = 'esther.sambale@dasei.eu')
        `)

        // Remove new projects
        await db.exec(`
            DELETE FROM projects 
            WHERE id IN ('oberland', 'muenchen', 'nuernberg', 'wahlfische', 'linklater_nuernberg', 'utopia_in_action')
        `)

        // Remove new users
        await db.exec(`
            DELETE FROM users 
            WHERE id IN (
                'nina.roob@utopia-in-action.de',
                'rosa.koeniger@utopia-in-action.de',
                'annie.duerrwang@theaterpedia.org',
                'sabine.menne@theaterpedia.org',
                'astrid.v-creytz@theaterpedia.org',
                'esther.sambale@dasei.eu',
                'eleanora.allerdings@dasei.eu'
            )
        `)

        console.log('✅ Migration 021 reverted')
    }
}
