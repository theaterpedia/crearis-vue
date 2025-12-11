/**
 * Demo Project Setup Script
 * 
 * Creates or resets the 'demo' project for user onboarding and testing.
 * 
 * Features:
 * - Creates project with domaincode='demo' if not exists
 * - Populates with sample events, posts, partners
 * - Provides reset function to restore to initial state
 * 
 * Usage:
 *   npx tsx server/database/setup-demo-project.ts [create|reset]
 */

import { db } from './db-new'
import type { DatabaseAdapter } from './adapter'

// Type alias for database client (using DatabaseAdapter interface)
type DbClient = DatabaseAdapter

// Demo project configuration
const DEMO_PROJECT = {
    domaincode: 'demo',
    title: 'Demo-Projekt',
    type: 'project',
    status: 2, // DEMO status
    owner_id: 1, // Admin user
    description: 'Demonstrationsprojekt für Onboarding und Tests. Wird regelmäßig zurückgesetzt.'
}

// Demo entities with special xmlid prefix '_demo'
// These can be cloned to user projects during onboarding
const DEMO_EVENTS = [
    {
        xmlid: 'demo.event.workshop-basics',
        title: 'Basis-Workshop',
        teaser: 'Ein Einführungs-Workshop zum Kennenlernen',
        status: 3 // DRAFT
    },
    {
        xmlid: 'demo.event.festival-demo',
        title: 'Demo-Festival',
        teaser: 'Ein beispielhaftes Festival-Event',
        status: 3
    }
]

const DEMO_POSTS = [
    {
        xmlid: 'demo.post.welcome',
        title: 'Willkommen im Demo-Projekt',
        teaser: 'Dies ist ein Beispiel-Post',
        status: 3
    },
    {
        xmlid: 'demo.post.howto',
        title: 'Wie nutze ich die Plattform?',
        teaser: 'Eine kurze Anleitung für neue Nutzer',
        status: 3
    }
]

const DEMO_INSTRUCTORS = [
    {
        xmlid: 'demo.instructor.example',
        entityname: 'Demo Dozent:in',
        status: 3
    }
]

async function createDemoProject(db: DbClient): Promise<number> {
    console.log('📦 Creating demo project...')
    
    // Check if already exists
    const existing = await db.get<{ id: number }>(
        'SELECT id FROM projects WHERE domaincode = $1',
        [DEMO_PROJECT.domaincode]
    )
    
    if (existing) {
        console.log(`  ✓ Demo project already exists (id: ${existing.id})`)
        return existing.id
    }
    
    // Create new project
    const result = await db.get<{ id: number }>(
        `INSERT INTO projects (domaincode, title, type, status, owner_id, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id`,
        [
            DEMO_PROJECT.domaincode,
            DEMO_PROJECT.title,
            DEMO_PROJECT.type,
            DEMO_PROJECT.status,
            DEMO_PROJECT.owner_id,
            DEMO_PROJECT.description
        ]
    )
    
    console.log(`  ✓ Created demo project (id: ${result?.id})`)
    return result?.id || 0
}

async function createDemoEntities(db: DbClient, projectId: number): Promise<void> {
    console.log('\n🎭 Creating demo entities...')
    
    // Create events
    for (const event of DEMO_EVENTS) {
        const existing = await db.get<{ id: number }>(
            'SELECT id FROM events WHERE xmlid = $1',
            [event.xmlid]
        )
        
        if (!existing) {
            await db.run(
                `INSERT INTO events (xmlid, title, teaser, status, project_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                [event.xmlid, event.title, event.teaser, event.status, projectId]
            )
            console.log(`  ✓ Created event: ${event.xmlid}`)
        } else {
            console.log(`  - Event exists: ${event.xmlid}`)
        }
    }
    
    // Create posts
    for (const post of DEMO_POSTS) {
        const existing = await db.get<{ id: number }>(
            'SELECT id FROM posts WHERE xmlid = $1',
            [post.xmlid]
        )
        
        if (!existing) {
            await db.run(
                `INSERT INTO posts (xmlid, title, teaser, status, project_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                [post.xmlid, post.title, post.teaser, post.status, projectId]
            )
            console.log(`  ✓ Created post: ${post.xmlid}`)
        } else {
            console.log(`  - Post exists: ${post.xmlid}`)
        }
    }
    
    // Create instructors
    for (const instructor of DEMO_INSTRUCTORS) {
        const existing = await db.get<{ id: number }>(
            'SELECT id FROM instructors WHERE xmlid = $1',
            [instructor.xmlid]
        )
        
        if (!existing) {
            await db.run(
                `INSERT INTO instructors (xmlid, entityname, status, project_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [instructor.xmlid, instructor.entityname, instructor.status, projectId]
            )
            console.log(`  ✓ Created instructor: ${instructor.xmlid}`)
        } else {
            console.log(`  - Instructor exists: ${instructor.xmlid}`)
        }
    }
}

async function resetDemoProject(db: DbClient): Promise<void> {
    console.log('🔄 Resetting demo project...')
    
    // Get project ID
    const project = await db.get<{ id: number }>(
        'SELECT id FROM projects WHERE domaincode = $1',
        [DEMO_PROJECT.domaincode]
    )
    
    if (!project) {
        console.log('  ⚠ Demo project not found, creating new...')
        const projectId = await createDemoProject(db)
        await createDemoEntities(db, projectId)
        return
    }
    
    const projectId = project.id
    
    // Delete all project members except owner
    await db.run(
        'DELETE FROM projects_members WHERE project_id = $1',
        [projectId]
    )
    console.log('  ✓ Cleared project members')
    
    // Reset events to initial state
    await db.run(
        'DELETE FROM events WHERE project_id = $1',
        [projectId]
    )
    console.log('  ✓ Cleared events')
    
    // Reset posts
    await db.run(
        'DELETE FROM posts WHERE project_id = $1',
        [projectId]
    )
    console.log('  ✓ Cleared posts')
    
    // Reset instructors
    await db.run(
        'DELETE FROM instructors WHERE project_id = $1',
        [projectId]
    )
    console.log('  ✓ Cleared instructors')
    
    // Re-create demo entities
    await createDemoEntities(db, projectId)
    
    console.log('\n✅ Demo project reset complete!')
}

async function main() {
    const command = process.argv[2] || 'create'
    
    console.log('='.repeat(50))
    console.log('Demo Project Setup')
    console.log('='.repeat(50))
    
    // Use the imported db instance directly
    const dbClient: DbClient = db
    
    try {
        if (command === 'reset') {
            await resetDemoProject(dbClient)
        } else {
            const projectId = await createDemoProject(dbClient)
            await createDemoEntities(dbClient, projectId)
            console.log('\n✅ Demo project setup complete!')
        }
    } catch (error) {
        console.error('\n❌ Error:', error)
        process.exit(1)
    } finally {
        // Close connection if needed
    }
}

main()
