/**
 * Migration 020: Add project images
 * 
 * Adds cimg (cover image) to all existing projects by randomly selecting from events
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '020_add_project_images',
    description: 'Add cover images to projects from events',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('Running migration 020: Add project images...')

        // Get all events with cimg
        const events = await db.all('SELECT cimg FROM events WHERE cimg IS NOT NULL AND cimg != \'\'', [])
        
        if (events.length === 0) {
            console.log('  ℹ️  No event images found, skipping...')
            return
        }

        console.log(`  - Found ${events.length} events with images`)

        // Get all projects
        const projects = await db.all('SELECT id FROM projects', [])
        
        console.log(`  - Updating ${projects.length} projects with random images...`)

        // Assign random images to each project
        for (const project of projects) {
            const randomEvent = events[Math.floor(Math.random() * events.length)]
            await db.exec(`
                UPDATE projects 
                SET cimg = '${randomEvent.cimg}'
                WHERE id = '${project.id}'
            `)
        }

        console.log('  ✅ Updated all projects with cover images')
        console.log('✅ Migration 020 completed')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Migration 020 down: Removing project images...')

        await db.exec(`
            UPDATE projects 
            SET cimg = NULL
        `)

        console.log('✅ Migration 020 reverted')
    }
}
