/**
 * Sync script to synchronize projects table to users table
 * This maintains a 1:1 mapping between project accounts and users
 * Run with: DATABASE_TYPE=postgresql DB_NAME=crearis_admin_dev DB_USER=crearis_admin DB_PASSWORD=7uqf9nE0umJmMMo npx tsx server/database/sync-projects-to-users.ts
 */

import { db } from './init.js'

async function syncProjectsToUsers() {
    console.log('🔄 Syncing projects to users table...\n')

    // Get all projects (which are user accounts)
    const projects = await db.all(
        'SELECT id, username, password_hash as password, role, created_at FROM projects',
        []
    )

    console.log(`📊 Found ${projects.length} projects to sync`)

    if (projects.length === 0) {
        console.log('⚠️  No projects found. Run seed-users.ts first.')
        process.exit(0)
    }

    // Clear existing users
    await db.run('DELETE FROM users', [])
    console.log('🗑️  Cleared existing users table\n')

    // Sync each project to users
    for (const project of projects as any[]) {
        await db.run(
            `INSERT INTO users (id, username, password, role, created_at)
       VALUES (?, ?, ?, ?, ?)`,
            [project.id, project.username, project.password, project.role, project.created_at]
        )

        console.log(`✅ Synced user: ${project.username} (${project.role})`)
    }

    console.log(`\n✅ Successfully synced ${projects.length} users`)

    // Verify sync
    const userCount = await db.get('SELECT COUNT(*) as count FROM users', [])
    const projectCount = await db.get('SELECT COUNT(*) as count FROM projects', [])

    console.log('\n📊 Verification:')
    console.log(`   Projects: ${(projectCount as any).count}`)
    console.log(`   Users:    ${(userCount as any).count}`)

    if ((userCount as any).count === (projectCount as any).count) {
        console.log('✅ Tables are in sync!')
    } else {
        console.log('⚠️  Warning: Table counts don\'t match')
    }

    process.exit(0)
}

syncProjectsToUsers().catch((err) => {
    console.error('❌ Error syncing:', err)
    process.exit(1)
})
