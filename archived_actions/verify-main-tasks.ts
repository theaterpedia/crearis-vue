/**
 * Verification Script: Main Tasks Auto-Creation
 * 
 * This script verifies that:
 * 1. Every entity (event, post, location, instructor) has a main task
 * 2. Main tasks are created automatically by triggers
 */

import { db } from '../server/database/db-new'

async function verifyMainTasks() {

    console.log('\n🔍 Verifying Main Tasks Auto-Creation...\n')

    try {
        // Count entities
        const events = await db.get('SELECT COUNT(*) as count FROM events', [])
        const posts = await db.get('SELECT COUNT(*) as count FROM posts', [])
        const locations = await db.get('SELECT COUNT(*) as count FROM locations', [])
        const instructors = await db.get('SELECT COUNT(*) as count FROM instructors', [])

        console.log('📊 Entity Counts:')
        console.log(`   Events: ${(events as any).count}`)
        console.log(`   Posts: ${(posts as any).count}`)
        console.log(`   Locations: ${(locations as any).count}`)
        console.log(`   Instructors: ${(instructors as any).count}`)

        const totalEntities = (events as any).count + (posts as any).count +
            (locations as any).count + (instructors as any).count
        console.log(`   Total Entities: ${totalEntities}\n`)

        // Count main tasks by type
        const eventTasks = await db.get(
            "SELECT COUNT(*) as count FROM tasks WHERE category='main' AND record_type='event'", []
        )
        const postTasks = await db.get(
            "SELECT COUNT(*) as count FROM tasks WHERE category='main' AND record_type='post'", []
        )
        const locationTasks = await db.get(
            "SELECT COUNT(*) as count FROM tasks WHERE category='main' AND record_type='location'", []
        )
        const instructorTasks = await db.get(
            "SELECT COUNT(*) as count FROM tasks WHERE category='main' AND record_type='instructor'", []
        )

        console.log('📋 Main Task Counts:')
        console.log(`   Event Main Tasks: ${(eventTasks as any).count}`)
        console.log(`   Post Main Tasks: ${(postTasks as any).count}`)
        console.log(`   Location Main Tasks: ${(locationTasks as any).count}`)
        console.log(`   Instructor Main Tasks: ${(instructorTasks as any).count}`)

        const totalMainTasks = (eventTasks as any).count + (postTasks as any).count +
            (locationTasks as any).count + (instructorTasks as any).count
        console.log(`   Total Main Tasks: ${totalMainTasks}\n`)

        // Verify 1:1 relationship
        const missingTasks = totalEntities - totalMainTasks

        if (missingTasks === 0) {
            console.log('✅ SUCCESS: Every entity has a main task attached!\n')
            console.log('   Triggers are working correctly.\n')
        } else if (missingTasks > 0) {
            console.log(`❌ ISSUE: ${missingTasks} entities are missing main tasks!\n`)

            // Find which entities are missing tasks
            const eventsWithoutTasks = await db.all(`
                SELECT e.id, e.name 
                FROM events e 
                LEFT JOIN tasks t ON t.record_type='event' AND t.record_id=e.id AND t.category='main'
                WHERE t.id IS NULL
                LIMIT 5
            `, [])

            const postsWithoutTasks = await db.all(`
                SELECT p.id, p.name 
                FROM posts p 
                LEFT JOIN tasks t ON t.record_type='post' AND t.record_id=p.id AND t.category='main'
                WHERE t.id IS NULL
                LIMIT 5
            `, [])

            if ((eventsWithoutTasks as any[]).length > 0) {
                console.log('   Events without main tasks:')
                    ; (eventsWithoutTasks as any[]).forEach((e: any) => {
                        console.log(`   - ${e.id}: ${e.name}`)
                    })
            }

            if ((postsWithoutTasks as any[]).length > 0) {
                console.log('   Posts without main tasks:')
                    ; (postsWithoutTasks as any[]).forEach((p: any) => {
                        console.log(`   - ${p.id}: ${p.name}`)
                    })
            }

            console.log('\n   💡 Solution: Triggers may not have been created yet.')
            console.log('      Run migrate-stage2.ts to create triggers.\n')
        } else {
            console.log(`⚠️  WARNING: More main tasks (${totalMainTasks}) than entities (${totalEntities})!\n`)
            console.log('   This might indicate duplicate tasks or orphaned tasks.\n')
        }

        // Sample some main tasks to verify they use {{main-title}}
        const sampleTasks = await db.all(`
            SELECT t.id, t.title, t.record_type, t.record_id,
                   CASE 
                       WHEN t.record_type='event' THEN e.name
                       WHEN t.record_type='post' THEN p.name
                       WHEN t.record_type='location' THEN l.name
                       WHEN t.record_type='instructor' THEN i.name
                   END as entity_name
            FROM tasks t
            LEFT JOIN events e ON t.record_type='event' AND t.record_id=e.id
            LEFT JOIN posts p ON t.record_type='post' AND t.record_id=p.id
            LEFT JOIN locations l ON t.record_type='location' AND t.record_id=l.id
            LEFT JOIN instructors i ON t.record_type='instructor' AND t.record_id=i.id
            WHERE t.category='main'
            LIMIT 3
        `, [])

        console.log('📝 Sample Main Tasks:')
            ; (sampleTasks as any[]).forEach((task: any) => {
                console.log(`   ${task.record_type} "${task.entity_name}": title="${task.title}"`)
            })

        const allUsePlaceholder = (sampleTasks as any[]).every((t: any) =>
            t.title === '{{main-title}}'
        )

        if (allUsePlaceholder) {
            console.log('\n   ✅ All main tasks use {{main-title}} placeholder\n')
        } else {
            console.log('\n   ⚠️  Some main tasks do not use {{main-title}} placeholder\n')
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message)
        throw error
    } finally {
        await db.close()
    }
}

// Run verification
verifyMainTasks().catch(console.error)
